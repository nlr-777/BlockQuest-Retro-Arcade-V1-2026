// BlockQuest Official - Quest Vault
// Gauntlet-style dungeon crawler teaching Multi-Sig concepts
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Text,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../src/constants/colors';
import { PixelText } from '../../src/components/PixelText';
import { PixelButton } from '../../src/components/PixelButton';
import { useGameStore } from '../../src/store/gameStore';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { RektScreen } from '../../src/components/RektScreen';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { CharacterDialogue } from '../../src/components/CharacterDialogue';
import { useCharacterBonus } from '../../src/hooks/useCharacterBonus';
import { useCharacterStore } from '../../src/store/characterStore';
import { RoastHUD } from '../../src/components/RoastHUD';
import { PowerUpHUD } from '../../src/components/PowerUpBar';
import { usePowerUpEffects } from '../../src/hooks/usePowerUpEffects';
import { GAMES } from '../../src/constants/games';
import {
  GameHaptics,
  ScreenShake,
  ComboDisplay,
  useFloatingScores,
  useComboSystem,
  useDifficultyScaling,
  ParticleBurst,
  LevelUpFlash,
  DangerWarning,
} from '../../src/utils/GameEnhancements';
import {
  useKeyboardControls,
  EnhancedDPad,
  KeyDirection,
} from '../../src/utils/GameControls';
import {
  GameModeSelector,
  LevelTransition,
  SurvivalHUD,
  getLevelTheme,
  getSurvivalTheme,
  GameMode,
} from '../../src/components/GameModeSelector';

const GAME_CONFIG = GAMES.find(g => g.id === 'quest-vault')!;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 32, 320);
const CELL_SIZE = 32;
const GRID_SIZE = 10;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;

// Tile types
const TILES = {
  FLOOR: 0,
  WALL: 1,
  VAULT: 2,
  KEY: 3,
  ENEMY: 4,
  TRAP: 5,
  GOLD: 6,
  SIGNER: 7, // Multi-sig signer
};

// Signer types for Multi-sig
const SIGNER_TYPES = [
  { id: 'alice', name: 'ALICE', color: '#FF6B6B', icon: '👩' },
  { id: 'bob', name: 'BOB', color: '#4ECDC4', icon: '👨' },
  { id: 'carol', name: 'CAROL', color: '#45B7D1', icon: '👧' },
];

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  type: 'ghost' | 'demon' | 'skeleton';
  health: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'key' | 'gold' | 'signer';
  signerId?: number;
  collected: boolean;
}

interface Vault {
  x: number;
  y: number;
  requiredSigners: number;
  unlocked: boolean;
}

type GameState = 'modeselect' | 'ready' | 'playing' | 'paused' | 'gameover' | 'victory' | 'rewards';

// Generate dungeon map
const generateDungeon = (level: number): number[][] => {
  const map: number[][] = [];
  
  // Initialize with floor
  for (let y = 0; y < GRID_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // Borders are walls
      if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  
  // Add some internal walls
  const wallCount = 5 + level * 2;
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    if (!(x === 1 && y === 1) && !(x === GRID_SIZE - 2 && y === GRID_SIZE - 2)) {
      map[y][x] = TILES.WALL;
    }
  }
  
  return map;
};

export default function QuestVaultGame() {
  const router = useRouter();
  const { submitScore, addXP } = useGameStore();
  const { playCollect, playHit, playGameStart, playGameOver, playPowerup, playLevelUp, playMove } = useGameAudio({ musicTrack: 'action' });

  // Power-up effects hook
  const powerUps = usePowerUpEffects();

  // Character bonus hook - for score multipliers
  const { 
    hasBonus, 
    bonusPercent, 
    applyBonus, 
    getBonusPoints,
    recordGame,
    abilityIcon 
  } = useCharacterBonus('quest-vault');

  // Character dialogue state
  const [showIntroDialogue, setShowIntroDialogue] = useState(false);
  const { getSelectedCharacter } = useCharacterStore();

  // Game state
  const [gameState, setGameState] = useState<GameState>('modeselect');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [survivalTime, setSurvivalTime] = useState(0);
  const [survivalMultiplier, setSurvivalMultiplier] = useState(1.0);
  const survivalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Enhanced game features
  const [shakeCount, setShakeCount] = useState(0);
  const [particleBurst, setParticleBurst] = useState({ x: 0, y: 0, trigger: 0 });
  const [level, setLevel] = useState(1);
  const [levelUpTrigger, setLevelUpTrigger] = useState(0);
  
  // Game enhancement hooks
  const { popups, addPopup, FloatingScoresComponent } = useFloatingScores();
  const { combo, showCombo, incrementCombo, resetCombo, getMultiplier } = useComboSystem(1500);
  
  const [score, setScore] = useState(0);
  const difficulty = useDifficultyScaling(score);
  const [health, setHealth] = useState(100);
  const [gold, setGold] = useState(0);
  
  // Map and entities
  const [map, setMap] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [vault, setVault] = useState<Vault>({ x: GRID_SIZE - 2, y: GRID_SIZE - 2, requiredSigners: 2, unlocked: false });
  const [collectedSigners, setCollectedSigners] = useState<number[]>([]);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);
  
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize game
  const initGame = useCallback(() => {
    const newMap = generateDungeon(1);
    setMap(newMap);
    setPlayerPos({ x: 1, y: 1 });
    setScore(0);
    setHealth(100);
    setLevel(1);
    setGold(0);
    setCollectedSigners([]);
    
    // Spawn enemies
    const newEnemies: Enemy[] = [];
    const enemyTypes: ('ghost' | 'demon' | 'skeleton')[] = ['ghost', 'demon', 'skeleton'];
    for (let i = 0; i < 3; i++) {
      let ex, ey;
      do {
        ex = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        ey = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      } while (newMap[ey][ex] === TILES.WALL);
      
      newEnemies.push({
        id: `enemy-${i}`,
        x: ex,
        y: ey,
        type: enemyTypes[i % 3],
        health: 30 + i * 10,
      });
    }
    setEnemies(newEnemies);
    
    // Spawn collectibles (signers + gold)
    const newCollectibles: Collectible[] = [];
    
    // Add signers for multi-sig
    for (let i = 0; i < 3; i++) {
      let sx, sy;
      do {
        sx = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        sy = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      } while (newMap[sy][sx] === TILES.WALL);
      
      newCollectibles.push({
        id: `signer-${i}`,
        x: sx,
        y: sy,
        type: 'signer',
        signerId: i,
        collected: false,
      });
    }
    
    // Add gold
    for (let i = 0; i < 5; i++) {
      let gx, gy;
      do {
        gx = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        gy = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      } while (newMap[gy][gx] === TILES.WALL);
      
      newCollectibles.push({
        id: `gold-${i}`,
        x: gx,
        y: gy,
        type: 'gold',
        collected: false,
      });
    }
    
    setCollectibles(newCollectibles);
    setVault({ x: GRID_SIZE - 2, y: GRID_SIZE - 2, requiredSigners: 2, unlocked: false });
  }, []);

  // Begin gameplay after dialogue
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    setHighScoreBeaten(false);
    powerUps.resetSession();
    playGameStart();
  }, [playGameStart]);

  // Handle dialogue dismiss  
  const handleDialogueDismiss = useCallback(() => {
    setShowIntroDialogue(false);
    beginGameplay();
  }, [beginGameplay]);

  // Start game - shows intro dialogue first
  const startGame = useCallback(() => {
    initGame();
    setShowIntroDialogue(true);
  }, [initGame]);

  // Handle rewards -> gameover transition
  const handleRewardsContinue = useCallback(() => {
    setGameState('gameover');
    setHighScoreBeaten(false);
  }, []);

  // Move player
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    // Check bounds and walls
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;
    if (map[newY]?.[newX] === TILES.WALL) return;
    
    setPlayerPos({ x: newX, y: newY });
    playMove();
    
    // Check collectible pickup
    setCollectibles(prev => prev.map(c => {
      if (!c.collected && c.x === newX && c.y === newY) {
        if (c.type === 'gold') {
          setGold(g => g + 10);
          setScore(s => s + 10);
          playCollect();
        } else if (c.type === 'signer' && c.signerId !== undefined) {
          setCollectedSigners(prev => [...prev, c.signerId!]);
          setScore(s => s + 50);
          playPowerup();
          if (Platform.OS !== 'web') GameHaptics.medium();
        }
        return { ...c, collected: true };
      }
      return c;
    }));
    
    // Check vault access
    if (newX === vault.x && newY === vault.y) {
      if (collectedSigners.length >= vault.requiredSigners) {
        playLevelUp();
        setScore(s => s + 200 + gold * 2);
        
        if (level >= 3) {
          setGameState('victory');
          submitScore('quest-vault', score + 200 + gold * 2);
          addXP(Math.floor((score + 200) / 5));
        } else {
          // Next level
          setLevel(l => {
            const newLevel = l + 1;
            initGame();
            return newLevel;
          });
        }
      }
    }
    
    // Check enemy collision
    enemies.forEach(enemy => {
      if (enemy.x === newX && enemy.y === newY) {
        playHit();
        setHealth(h => {
          const newHealth = h - 20;
          if (newHealth <= 0) {
            playGameOver();
            setHighScoreBeaten(score > 0);
            setGameState('rewards');
            submitScore('quest-vault', applyBonus(score));
            return 0;
          }
          if (Platform.OS !== 'web') GameHaptics.error();
          return newHealth;
        });
      }
    });
  }, [gameState, playerPos, map, vault, collectedSigners, enemies, gold, level, score, playMove, playCollect, playPowerup, playHit, playLevelUp, playGameOver, initGame, submitScore, addXP]);

  // Keyboard controls for web
  const handleKeyDirection = useCallback((dir: KeyDirection) => {
    if (gameState !== 'playing') return;
    const keyMap: Record<string, [number, number]> = {
      up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    };
    if (keyMap[dir]) movePlayer(keyMap[dir][0], keyMap[dir][1]);
  }, [gameState, movePlayer]);

  useKeyboardControls({ onDirection: handleKeyDirection, enabled: gameState === 'playing' });

  // Enemy movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setEnemies(prev => prev.map(enemy => {
        // Simple AI: move toward player sometimes
        if (Math.random() < 0.3) {
          const dx = playerPos.x > enemy.x ? 1 : playerPos.x < enemy.x ? -1 : 0;
          const dy = playerPos.y > enemy.y ? 1 : playerPos.y < enemy.y ? -1 : 0;
          
          // Randomly choose horizontal or vertical
          let newX = enemy.x;
          let newY = enemy.y;
          
          if (Math.random() < 0.5 && dx !== 0) {
            newX = enemy.x + dx;
          } else if (dy !== 0) {
            newY = enemy.y + dy;
          }
          
          // Check if valid move
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
              map[newY]?.[newX] !== TILES.WALL) {
            
            // Check player collision
            if (newX === playerPos.x && newY === playerPos.y) {
              playHit();
              setHealth(h => {
                const newHealth = h - 15;
                if (newHealth <= 0) {
                  playGameOver();
                  setHighScoreBeaten(score > 0);
                  setGameState('rewards');
                  submitScore('quest-vault', applyBonus(score));
                  return 0;
                }
                if (Platform.OS !== 'web') GameHaptics.error();
                return newHealth;
              });
            }
            
            return { ...enemy, x: newX, y: newY };
          }
        }
        return enemy;
      }));
    }, 800);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerPos, map, score, playHit, playGameOver, submitScore]);

  const getEnemyIcon = (type: string) => {
    switch (type) {
      case 'ghost': return '👻';
      case 'demon': return '👹';
      case 'skeleton': return '💀';
      default: return '👾';
    }
  };

  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setSurvivalTime(0);
    setSurvivalMultiplier(1.0);
    setGameState('ready');
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'survival') {
      survivalTimerRef.current = setInterval(() => {
        setSurvivalTime(t => t + 1);
        setSurvivalMultiplier(m => Math.min(5.0, m + 0.05));
      }, 1000);
    }
    return () => { if (survivalTimerRef.current) clearInterval(survivalTimerRef.current); };
  }, [gameState, gameMode]);

  if (gameState === 'modeselect') {
    return (
      <GameModeSelector
        gameTitle="Quest Vault"
        gameEmoji="🏰"
        gameColor={COLORS.neonCyan}
        onSelectMode={handleModeSelect}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Game Enhancements */}
        <FloatingScoresComponent />
        <ComboDisplay combo={combo} visible={showCombo} />
        <ParticleBurst x={particleBurst.x} y={particleBurst.y} trigger={particleBurst.trigger} color="#9945FF" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.scoreContainer}>
            <PixelText size="xs" color={COLORS.textMuted}>SCORE</PixelText>
            <PixelText size="lg" color={COLORS.neonPink} glow>{score}</PixelText>
          </View>
          <View style={styles.healthContainer}>
            <PixelText size="xs" color={COLORS.textMuted}>HP</PixelText>
            <PixelText size="lg" color={health > 50 ? COLORS.success : COLORS.error}>{health}</PixelText>
          </View>
        </View>

        {/* Stats Bar */}
        {gameState === 'playing' && (
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>LEVEL</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>{level}/3</PixelText>
            </View>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>GOLD</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>💰 {gold}</PixelText>
            </View>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>SIGNERS</PixelText>
              <PixelText size="sm" color={collectedSigners.length >= vault.requiredSigners ? COLORS.success : COLORS.neonCyan}>
                {collectedSigners.length}/{vault.requiredSigners}
              </PixelText>
            </View>
          </View>
        )}

        {/* Multi-Sig Status */}
        {gameState === 'playing' && (
          <View style={styles.signerBar}>
            {SIGNER_TYPES.map((signer, i) => (
              <View 
                key={signer.id}
                style={[
                  styles.signerBadge,
                  { backgroundColor: collectedSigners.includes(i) ? signer.color : COLORS.bgMedium }
                ]}
              >
                <Text style={styles.signerIcon}>{signer.icon}</Text>
                <Text style={[styles.signerName, { color: collectedSigners.includes(i) ? '#fff' : COLORS.textMuted }]}>
                  {signer.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Map tiles */}
          {map.map((row, y) => (
            <View key={y} style={styles.mapRow}>
              {row.map((tile, x) => (
                <View
                  key={`${x}-${y}`}
                  style={[
                    styles.tile,
                    tile === TILES.WALL ? styles.wallTile : styles.floorTile,
                  ]}
                />
              ))}
            </View>
          ))}

          {/* Vault */}
          <View style={[styles.entity, { left: vault.x * CELL_SIZE, top: vault.y * CELL_SIZE }]}>
            <Text style={styles.vaultIcon}>
              {collectedSigners.length >= vault.requiredSigners ? '🔓' : '🔒'}
            </Text>
          </View>

          {/* Collectibles */}
          {collectibles.map(c => !c.collected && (
            <View key={c.id} style={[styles.entity, { left: c.x * CELL_SIZE, top: c.y * CELL_SIZE }]}>
              <Text style={styles.collectibleIcon}>
                {c.type === 'gold' ? '💰' : SIGNER_TYPES[c.signerId || 0].icon}
              </Text>
            </View>
          ))}

          {/* Enemies */}
          {enemies.map(enemy => (
            <View key={enemy.id} style={[styles.entity, { left: enemy.x * CELL_SIZE, top: enemy.y * CELL_SIZE }]}>
              <Text style={styles.enemyIcon}>{getEnemyIcon(enemy.type)}</Text>
            </View>
          ))}

          {/* Player */}
          <View style={[styles.entity, styles.player, { left: playerPos.x * CELL_SIZE, top: playerPos.y * CELL_SIZE }]}>
            <Text style={styles.playerIcon}>🧙</Text>
          </View>
        </View>

        {/* D-Pad Controls - Enhanced */}
        {gameState === 'playing' && (
          <View style={styles.controls}>
            <EnhancedDPad
              onUp={() => movePlayer(0, -1)}
              onDown={() => movePlayer(0, 1)}
              onLeft={() => movePlayer(-1, 0)}
              onRight={() => movePlayer(1, 0)}
              size="md"
              color={combo >= 5 ? '#FF00FF' : COLORS.neonCyan}
              disabled={gameState !== 'playing'}
            />
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <PixelText size="xs" color={COLORS.neonCyan}>🔐 MULTI-SIG:</PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            Collect {vault.requiredSigners} signers to unlock the vault! Multiple keys = secure custody.
          </PixelText>
        </View>

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <View style={styles.overlay}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
              <PixelText size="xxl" color={COLORS.error} glow>QUEST VAULT</PixelText>
              <Text style={styles.menuIcon}>🏰⚔️</Text>
              
              <View style={styles.instructionBox}>
                <PixelText size="xs" color={COLORS.chainGold}>HOW TO PLAY:</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Use D-PAD to move your wizard</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Collect signers (👩👨👧) for multi-sig</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Avoid enemies, reach the vault!</PixelText>
                <PixelText size="xs" color={COLORS.neonCyan}>💡 2-of-3 signers needed to unlock!</PixelText>
              </View>
              
              <PixelButton
                title="START QUEST"
                onPress={startGame}
                color={COLORS.error}
                size="lg"
                style={{ marginTop: 24 }}
              />
            </Animated.View>
          </View>
        )}

        {/* Game Rewards Modal */}
        <GameRewardsModal
          visible={gameState === 'rewards'}
          gameId="quest-vault"
          gameName="Quest Vault"
          score={score}
          baseXP={Math.floor(score / 10)}
          isNewHighScore={highScoreBeaten}
          onContinue={handleRewardsContinue}
        />

        {/* Game Over - Using RektScreen */}
        <RektScreen
          visible={gameState === 'gameover'}
          score={score}
          reason={`Gold: ${gold}`}
          onRetry={startGame}
          onQuit={() => router.back()}
        />

        {/* Victory */}
        {gameState === 'victory' && (
          <View style={styles.overlay}>
            <View style={styles.menuContent}>
              <PixelText size="xl" color={COLORS.success} glow>VAULT SECURED!</PixelText>
              <PixelText size="lg" color={COLORS.chainGold}>Score: {score}</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>Multi-Sig Master! 🎉</PixelText>
              <View style={styles.gameOverButtons}>
                <PixelButton title="PLAY AGAIN" onPress={startGame} color={COLORS.success} />
                <PixelButton title="EXIT" onPress={() => router.back()} color={COLORS.textMuted} />
              </View>
            </View>
          </View>
        )}
        
        {/* Character Story Dialogue */}
        <CharacterDialogue
          gameId="quest-vault"
          visible={showIntroDialogue}
          onDismiss={handleDialogueDismiss}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scoreContainer: { alignItems: 'center' },
  healthContainer: { alignItems: 'center' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: COLORS.cardBg, marginHorizontal: 16, borderRadius: 8 },
  stat: { alignItems: 'center' },
  signerBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, marginHorizontal: 16 },
  signerBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  signerIcon: { fontSize: 16 },
  signerName: { fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gameArea: { alignSelf: 'center', backgroundColor: '#2a1a1a', borderWidth: 3, borderColor: COLORS.error, borderRadius: 8, marginTop: 8, overflow: 'hidden', position: 'relative' },
  mapRow: { flexDirection: 'row' },
  tile: { width: CELL_SIZE, height: CELL_SIZE },
  floorTile: { backgroundColor: '#3a2a2a' },
  wallTile: { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#4a3a3a' },
  entity: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center' },
  player: { zIndex: 10 },
  playerIcon: { fontSize: 22 },
  enemyIcon: { fontSize: 20 },
  collectibleIcon: { fontSize: 18 },
  vaultIcon: { fontSize: 24 },
  controls: { alignItems: 'center', paddingVertical: 12 },
  dpadRow: { flexDirection: 'row', justifyContent: 'center' },
  dpadButton: { width: 56, height: 56, backgroundColor: COLORS.cardBg, borderRadius: 8, justifyContent: 'center', alignItems: 'center', margin: 2, borderWidth: 2, borderColor: COLORS.cardBorder },
  dpadCenter: { width: 56, height: 56, margin: 2 },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 24, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.error, maxWidth: 320 },
  menuIcon: { fontSize: 48, marginVertical: 16 },
  instructionBox: { backgroundColor: COLORS.bgDark, padding: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
