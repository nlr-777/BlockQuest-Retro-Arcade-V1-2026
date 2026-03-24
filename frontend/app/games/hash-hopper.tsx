// Block Quest Official - Hash Hopper (Frogger Style Game)
// Teaches: Hash Functions - Tiny changes scramble everything
// Enhanced with better touch controls, combos, particles, and haptics
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { PixelText } from '../../src/components/PixelText';
import { PixelButton } from '../../src/components/PixelButton';
import VFXLayer from '../../src/vfx/VFXManager';
import { COLORS } from '../../src/constants/colors';
import { GAMES } from '../../src/constants/games';
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
import {
  GameHaptics,
  useSwipeGesture,
  ScreenShake,
  ComboDisplay,
  useFloatingScores,
  useComboSystem,
  useDifficultyScaling,
  ParticleBurst,
  TouchControls,
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
  getLevelTheme,
  getSurvivalTheme,
  GameMode,
} from '../../src/components/GameModeSelector';
import {
  useSurvivalEngine,
  SurvivalOverlay,
  WaveAnnouncement,
} from '../../src/utils/SurvivalEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Game constants
const GRID_COLS = 9;
const GRID_ROWS = 11;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 32) / GRID_COLS, 36);
const GAME_WIDTH = GRID_COLS * CELL_SIZE;
const GAME_HEIGHT = GRID_ROWS * CELL_SIZE;

type Position = { x: number; y: number };
type GameState = 'modeselect' | 'menu' | 'playing' | 'paused' | 'gameover' | 'rewards' | 'victory';

interface Lane {
  type: 'safe' | 'road' | 'water' | 'goal';
  objects: { x: number; width: number; speed: number; isLog?: boolean }[];
}

// Generate simple hash
const generateHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
};

export default function HashHopperGame() {
  const router = useRouter();
  const { profile, updateScore, mintBadge, addXP, highScores, modeHighScores } = useGameStore();
  
  // Audio hook
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

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
  } = useCharacterBonus('hash-hopper');

  // Character dialogue state
  const [showIntroDialogue, setShowIntroDialogue] = useState(false);
  const { getSelectedCharacter } = useCharacterStore();

  // Game state
  const selectedCharacterId = useCharacterStore(s => s.selectedCharacterId);
  const [gameState, setGameState] = useState<GameState>('modeselect');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  // Wave announcement state
  const [showWaveAnnouncement, setShowWaveAnnouncement] = useState(false);
  const [announcedWave, setAnnouncedWave] = useState(1);
  const waveAnnouncementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Survival Engine hook - must be before any early returns
  const survival = useSurvivalEngine({
    enabled: gameMode === 'survival' && gameState === 'playing',
    waveInterval: 25,
    bossInterval: 90,
    powerUpInterval: 15,
    onWaveChange: (wave) => {
      setAnnouncedWave(wave);
      setShowWaveAnnouncement(true);
      if (waveAnnouncementTimer.current) clearTimeout(waveAnnouncementTimer.current);
      waveAnnouncementTimer.current = setTimeout(() => setShowWaveAnnouncement(false), 2500);
    },
    onBossSpawn: () => {},
    onBossDefeat: () => {
      setScore(s => s + 500);
    },
  });

  // Auto-collect spawned power-ups in survival mode
  useEffect(() => {
    if (survival.spawnedPowerUp && gameMode === 'survival') {
      survival.collectPowerUp();
    }
  }, [survival.spawnedPowerUp, gameMode]);

  // Survival difficulty affects game speed
  const survivalSpeedBoost = gameMode === 'survival' ? Math.floor(survival.difficultyScale * 10) : 0;
  const survivalScoreMultiplier = gameMode === 'survival' ? survival.multiplier : 1.0;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 4, y: 10 });
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [pathTaken, setPathTaken] = useState<string>('');
  const [currentHash, setCurrentHash] = useState('00000000');
  const [highestRow, setHighestRow] = useState(10);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);
  
  // Enhanced game features
  const [shakeCount, setShakeCount] = useState(0);
  const [particleBurst, setParticleBurst] = useState({ x: 0, y: 0, trigger: 0 });
  const [level, setLevel] = useState(1);
  const [levelUpTrigger, setLevelUpTrigger] = useState(0);
  
  // Game enhancement hooks
  const { popups, addPopup, FloatingScoresComponent } = useFloatingScores();
  const { combo, showCombo, incrementCombo, resetCombo, getMultiplier } = useComboSystem(1500);
  const difficulty = useDifficultyScaling(score);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize lanes
  const initLanes = useCallback(() => {
    const newLanes: Lane[] = [
      { type: 'goal', objects: [] },                                    // Row 0 - Goal
      { type: 'water', objects: [{ x: 0, width: 3, speed: 1, isLog: true }, { x: 5, width: 2, speed: 1, isLog: true }] },
      { type: 'water', objects: [{ x: 2, width: 2, speed: -0.8, isLog: true }, { x: 7, width: 2, speed: -0.8, isLog: true }] },
      { type: 'safe', objects: [] },                                    // Row 3 - Safe zone
      { type: 'road', objects: [{ x: 0, width: 1, speed: 1.2 }, { x: 4, width: 1, speed: 1.2 }, { x: 7, width: 1, speed: 1.2 }] },
      { type: 'road', objects: [{ x: 2, width: 1, speed: -1 }, { x: 5, width: 1, speed: -1 }] },
      { type: 'road', objects: [{ x: 1, width: 1, speed: 0.8 }, { x: 6, width: 1, speed: 0.8 }] },
      { type: 'safe', objects: [] },                                    // Row 7 - Safe zone
      { type: 'road', objects: [{ x: 0, width: 1, speed: -1.5 }, { x: 3, width: 1, speed: -1.5 }, { x: 6, width: 1, speed: -1.5 }] },
      { type: 'road', objects: [{ x: 2, width: 1, speed: 1.3 }, { x: 7, width: 1, speed: 1.3 }] },
      { type: 'safe', objects: [] },                                    // Row 10 - Start
    ];
    return newLanes;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setLanes(initLanes());
    setPlayerPos({ x: 4, y: 10 });
    setScore(0);
    setLives(3);
    setPathTaken('');
    setCurrentHash('00000000');
    setHighestRow(10);
  }, [initLanes]);

  // Begin gameplay after dialogue
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    powerUps.resetSession();
    startTimeRef.current = Date.now();
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

  // Move player with enhanced feedback
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    playJump();
    GameHaptics.light();
    
    setPlayerPos(prev => {
      const newX = Math.max(0, Math.min(GRID_COLS - 1, prev.x + dx));
      const newY = Math.max(0, Math.min(GRID_ROWS - 1, prev.y + dy));
      
      // Update path and hash
      const direction = dy < 0 ? 'U' : dy > 0 ? 'D' : dx < 0 ? 'L' : 'R';
      const newPath = pathTaken + direction;
      setPathTaken(newPath);
      setCurrentHash(generateHash(newPath));
      
      // Score for progress with combo multiplier
      if (newY < highestRow) {
        const basePoints = (highestRow - newY) * 10;
        const multipliedPoints = Math.floor(basePoints * getMultiplier() * difficulty.scoreMultiplier);
        setScore(s => s + multipliedPoints);
        incrementCombo();
        
        // Show floating score
        const screenX = SCREEN_WIDTH / 2 + (newX - 4) * CELL_SIZE;
        const screenY = 200 + newY * CELL_SIZE;
        addPopup(multipliedPoints, screenX, screenY, combo >= 3 ? 'combo' : 'normal');
        
        // Particle burst for combos
        if (combo >= 3) {
          setParticleBurst({ x: screenX, y: screenY, trigger: Date.now() });
        }
        
        setHighestRow(newY);
        
        // Level up check
        const newLevel = Math.floor(score / 500) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          setLevelUpTrigger(prev => prev + 1);
          playLevelUp();
          GameHaptics.success();
        }
      }
      
      // Check goal - big reward!
      if (newY === 0) {
        const goalBonus = Math.floor(100 * getMultiplier() * difficulty.scoreMultiplier);
        setScore(s => s + powerUps.calculateScore(goalBonus));
        addPopup(goalBonus, SCREEN_WIDTH / 2, 150, 'bonus');
        GameHaptics.success();
        playCollect();
        
        // Reset position but keep score
        setTimeout(() => {
          setPlayerPos({ x: 4, y: 10 });
          setHighestRow(10);
          setPathTaken('');
        }, 500);
      }
      
      return { x: newX, y: newY };
    });
  }, [gameState, pathTaken, highestRow, combo, level, score, difficulty, getMultiplier, incrementCombo, addPopup]);

  // Keyboard controls for web
  const handleKeyDirection = useCallback((dir: KeyDirection) => {
    if (gameState !== 'playing') return;
    const keyMap: Record<string, [number, number]> = {
      up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    };
    if (keyMap[dir]) movePlayer(keyMap[dir][0], keyMap[dir][1]);
  }, [gameState, movePlayer]);

  useKeyboardControls({ onDirection: handleKeyDirection, enabled: gameState === 'playing' });

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Move lane objects
      setLanes(prev => prev.map(lane => ({
        ...lane,
        objects: lane.objects.map(obj => {
          let newX = obj.x + obj.speed * 0.1;
          // Wrap around
          if (newX > GRID_COLS) newX = -obj.width;
          if (newX + obj.width < 0) newX = GRID_COLS;
          return { ...obj, x: newX };
        }),
      })));

      // Check collisions
      const currentLane = lanes[playerPos.y];
      if (currentLane) {
        if (currentLane.type === 'road') {
          // Check car collision
          for (const obj of currentLane.objects) {
            if (playerPos.x >= obj.x && playerPos.x < obj.x + obj.width) {
              // Hit by car!
              GameHaptics.error();
              setShakeCount(prev => prev + 1);
              resetCombo();
              playHit();
              
              setLives(l => {
                if (l <= 1) {
                  const currentHighScore = highScores?.['hash-hopper'] || 0;
                  if (score > currentHighScore) {
                    setHighScoreBeaten(true);
                  }
                  playGameOver();
                  setGameState('rewards');
                  return 0;
                }
                setPlayerPos({ x: 4, y: 10 });
                setHighestRow(10);
                return l - 1;
              });
              break;
            }
          }
        } else if (currentLane.type === 'water') {
          // Check if on log
          let onLog = false;
          for (const obj of currentLane.objects) {
            if (obj.isLog && playerPos.x >= obj.x && playerPos.x < obj.x + obj.width) {
              onLog = true;
              // Move with log
              setPlayerPos(prev => ({
                ...prev,
                x: Math.max(0, Math.min(GRID_COLS - 1, prev.x + obj.speed * 0.1)),
              }));
              break;
            }
          }
          if (!onLog) {
            // Fell in water!
            GameHaptics.error();
            setShakeCount(prev => prev + 1);
            resetCombo();
            playHit();
            
            setLives(l => {
              if (l <= 1) {
                const currentHighScore = highScores?.['hash-hopper'] || 0;
                if (score > currentHighScore) {
                  setHighScoreBeaten(true);
                }
                playGameOver();
                setGameState('rewards');
                return 0;
              }
              setPlayerPos({ x: 4, y: 10 });
              setHighestRow(10);
              return l - 1;
            });
          }
        }
      }
    }, 100 / difficulty.speedMultiplier);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, lanes, playerPos, difficulty.speedMultiplier]);

  // Handle game over (after rewards modal)
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Update score (XP is already awarded by GameRewardsModal)
      updateScore('hash-hopper', applyBonus(score), duration);

      axios.post(`${BACKEND_URL}/api/leaderboard`, {
        player_id: profile.id,
        player_name: profile.username,
        game_id: 'hash-hopper',
        score,
        duration,
      }).catch(console.error);

      if (score >= 200) {
        mintBadge({
          name: score >= 500 ? 'Hash Master' : 'Hash Hopper',
          description: score >= 500 
            ? 'Scored 500+ in Hash Hopper!' 
            : 'Scored 200+ in Hash Hopper!',
          rarity: score >= 500 ? 'Epic' : 'Rare',
          gameId: 'hash-hopper',
          traits: { score, final_hash: currentHash, path_length: pathTaken.length },
          icon: score >= 500 ? '🔐' : '🐸',
        });
      }
    }
  }, [gameState]);

  // Render lane
  const renderLane = (lane: Lane, rowIndex: number) => {
    const bgColor = lane.type === 'safe' ? COLORS.hashGreen + '30' :
                    lane.type === 'road' ? '#333' :
                    lane.type === 'water' ? '#0066CC' :
                    COLORS.chainGold + '30';

    return (
      <View key={rowIndex} style={[styles.lane, { backgroundColor: bgColor }]}>
        {lane.objects.map((obj, idx) => (
          <View
            key={idx}
            style={[
              styles.laneObject,
              {
                left: obj.x * CELL_SIZE,
                width: obj.width * CELL_SIZE - 4,
                backgroundColor: obj.isLog ? '#8B4513' : '#FF4444',
              },
            ]}
          />
        ))}
        {rowIndex === 0 && (
          <View style={styles.goalIndicator}>
            <PixelText size="xs" color={COLORS.chainGold}>GOAL</PixelText>
          </View>
        )}
      </View>
    );
  };

  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    survival.reset();
    setGameState('menu');
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'survival') {
      survivalSpeedBoostrRef.current = setInterval(() => {
      }, 1000);
    }
    return () => { if (survivalSpeedBoostrRef.current) clearInterval(survivalSpeedBoostrRef.current); };
  }, [gameState, gameMode]);

  if (gameState === 'modeselect') {
    return (
      <GameModeSelector
        gameTitle="Hash Hopper"
        gameEmoji="🐸"
        gameColor={COLORS.hashGreen}
        onSelectMode={handleModeSelect}
        highScores={modeHighScores['hash-hopper'] || { classic: 0, survival: 0 }}
        onBack={() => router.back()}
          characterId={selectedCharacterId}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenShake intensity={8} trigger={shakeCount}>
        <VFXLayer type="crt-breathe" intensity={0.2} />
        
        {/* Floating Scores */}
        <FloatingScoresComponent />
        
        {/* Combo Display */}
        <ComboDisplay combo={combo} visible={showCombo} />
        
        {/* Level Up Flash */}
        <LevelUpFlash trigger={levelUpTrigger} level={level} />
        
        {/* Danger Warning when low health */}
        <DangerWarning active={lives === 1 && gameState === 'playing'} />
        
        {/* Particle Burst */}
        <ParticleBurst 
          x={particleBurst.x} 
          y={particleBurst.y} 
          trigger={particleBurst.trigger}
          color="#00FF41"
        />
        
        {/* Roast HUD - Shows during gameplay */}
        {gameState === 'playing' && (
          <RoastHUD
            score={score}
            lives={lives}
            goal="Reach the goal!"
            gameId="hash-hopper"
            showPuns={true}
          />
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <PixelText size="xs" color={COLORS.textSecondary}>SCORE</PixelText>
            <PixelText size="lg" color={COLORS.hashGreen} glow>{score}</PixelText>
            {combo > 1 && (
              <Text style={styles.comboIndicator}>{combo}x</Text>
            )}
          </View>
          
          <View style={styles.livesContainer}>
            {Array(lives).fill(0).map((_, i) => (
              <PixelText key={i} size="md">💚</PixelText>
            ))}
          </View>
        </View>
        
        {/* Difficulty Indicator */}
        {gameState === 'playing' && (
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{difficulty.difficultyName}</Text>
          </View>
        )}

        {/* Hash Display */}
        <View style={styles.hashDisplay}>
          <PixelText size="xs" color={COLORS.textSecondary}>CURRENT HASH:</PixelText>
          <PixelText size="md" color={COLORS.hashGreen} glow style={styles.hashText}>
            0x{currentHash}
          </PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
          Path: {pathTaken || 'START'}
        </PixelText>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {lanes.map((lane, idx) => renderLane(lane, idx))}
        
        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: playerPos.x * CELL_SIZE + 4,
              top: playerPos.y * CELL_SIZE + 4,
            },
          ]}
        >
          <PixelText size="lg">🐸</PixelText>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <PixelText size="xs" color={COLORS.hashGreen}>HASH LESSON:</PixelText>
        <PixelText size="xs" color={COLORS.textMuted}>
          Watch the hash change with each hop! Even tiny path changes create completely different hashes.
        </PixelText>
      </View>

      {/* Controls - Enhanced D-Pad */}
      <View style={styles.controls}>
        <EnhancedDPad
          onUp={() => movePlayer(0, -1)}
          onDown={() => movePlayer(0, 1)}
          onLeft={() => movePlayer(-1, 0)}
          onRight={() => movePlayer(1, 0)}
          size="md"
          color={combo >= 5 ? '#FF00FF' : combo >= 3 ? '#00FFFF' : COLORS.hashGreen}
          disabled={gameState !== 'playing'}
        />
      </View>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <View style={styles.overlay}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
            <PixelText size="xxl" color={COLORS.hashGreen} glow>HASH HOPPER</PixelText>
            <PixelText size="md" style={styles.menuIcon}>🐸</PixelText>
            <PixelText size="sm" color={COLORS.textSecondary} style={styles.menuSubtitle}>
              Cross traffic and rivers to reach the goal!
            </PixelText>
            <PixelText size="xs" color={COLORS.blockCyan} style={styles.menuHint}>
              Watch how your path changes the hash!
            </PixelText>
            <PixelButton
              title="START GAME"
              onPress={startGame}
              color={COLORS.hashGreen}
              size="lg"
              style={{ marginTop: 32 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Game Rewards Modal - Shows XP with faction bonus! */}
      <GameRewardsModal
        visible={gameState === 'rewards'}
        gameId="hash-hopper"
        gameName="Hash Hopper"
        score={score}
        baseXP={Math.floor(score / 10)}
        isNewHighScore={highScoreBeaten}
        onContinue={handleRewardsContinue}
      />

      {/* Game Over - Using RektScreen */}
      <RektScreen
        visible={gameState === 'gameover'}
        score={score}
        reason={`Hash: 0x${currentHash} | Path: ${pathTaken.length}`}
        onRetry={startGame}
        onQuit={() => router.push('/')}
      />
      {/* Character Story Dialogue */}
      <CharacterDialogue
        gameId="hash-hopper"
        visible={showIntroDialogue}
        onDismiss={handleDialogueDismiss}
      />
      </ScreenShake>

      {/* Survival Overlay HUD (Enhanced) */}
      {gameMode === 'survival' && (
        <SurvivalOverlay
          timeAlive={survival.timeAlive}
          multiplier={survival.multiplier}
          wave={survival.wave}
          waveTimer={survival.waveTimer}
          activePowerUp={survival.activePowerUp}
          powerUpTimer={survival.powerUpTimer}
          isBossWave={survival.isBossWave}
          bossHealth={survival.bossHealth}
          color={levelTheme.primary}
          visible={gameState === 'playing'}
        />
      )}
      
      {/* Wave Announcement */}
      <WaveAnnouncement wave={announcedWave} visible={showWaveAnnouncement} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scoreContainer: { alignItems: 'center' },
  livesContainer: { flexDirection: 'row' },
  comboIndicator: { fontSize: 12, color: '#00FFFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  difficultyBadge: { position: 'absolute', top: 100, right: 16, backgroundColor: 'rgba(0, 255, 65, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#00FF41' },
  difficultyText: { fontSize: 10, color: '#00FF41', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  hashDisplay: { alignItems: 'center', paddingVertical: 8, backgroundColor: COLORS.cardBg, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  hashText: { fontFamily: 'monospace', letterSpacing: 2 },
  gameArea: { alignSelf: 'center', backgroundColor: COLORS.bgMedium, borderWidth: 2, borderColor: COLORS.hashGreen, position: 'relative', overflow: 'hidden' },
  lane: { height: CELL_SIZE, width: '100%', position: 'relative' },
  laneObject: { position: 'absolute', height: CELL_SIZE - 8, top: 4, borderRadius: 4 },
  goalIndicator: { position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -20 }, { translateY: -10 }] },
  player: { position: 'absolute', width: CELL_SIZE - 8, height: CELL_SIZE - 8, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginVertical: 8 },
  controls: { paddingVertical: 8, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  controlButton: { width: 56, height: 56, backgroundColor: COLORS.cardBg, borderRadius: 8, borderWidth: 2, borderColor: COLORS.hashGreen, justifyContent: 'center', alignItems: 'center', margin: 4 },
  controlSpacer: { width: 56, margin: 4 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 32, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.hashGreen, maxWidth: 320 },
  menuIcon: { fontSize: 60, marginVertical: 16 },
  menuSubtitle: { textAlign: 'center', marginBottom: 8 },
  menuHint: { textAlign: 'center' },
  badgeEarned: { backgroundColor: COLORS.success + '30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
