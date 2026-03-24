// Block Quest Official - Block Muncher (Pac-Man Style Game)
// Teaches: Blockchain Basics - Creating an unbreakable chain
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
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
import { useCharacterStore } from '../../src/store/characterStore';
import { useCharacterBonus } from '../../src/hooks/useCharacterBonus';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { RektScreen } from '../../src/components/RektScreen';
import { RoastHUD } from '../../src/components/RoastHUD';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { PowerUpHUD } from '../../src/components/PowerUpBar';
import { usePowerUpEffects } from '../../src/hooks/usePowerUpEffects';
import { CharacterDialogue } from '../../src/components/CharacterDialogue';
import { 
  BQOToken, 
  NFTGem, 
  ChainLink, 
  WalletPowerup,
  BlockchainProgress,
  TokenCollectEffect 
} from '../../src/components/BlockchainGameElements';
import { getGameMechanics, getRandomTip } from '../../src/constants/gameMechanics';
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

const GAME_CONFIG = GAMES.find(g => g.id === 'block-muncher')!;
const GAME_MECHANICS = getGameMechanics('block-muncher')!;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Game constants
const GRID_SIZE = 15;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 32) / GRID_SIZE, 24);
const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;

// Directions
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

type Direction = keyof typeof DIRECTIONS;
type Position = { x: number; y: number };
type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'rewards';

// Generate maze/blocks
const generateBlocks = () => {
  const blocks: Position[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Skip center area and some paths
      if (
        (y === Math.floor(GRID_SIZE / 2) && x > 2 && x < GRID_SIZE - 3) ||
        (x === Math.floor(GRID_SIZE / 2) && y > 2 && y < GRID_SIZE - 3) ||
        (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1)
      ) {
        continue;
      }
      // Create some walls
      if (
        ((x === 3 || x === GRID_SIZE - 4) && y > 2 && y < GRID_SIZE - 3 && y !== Math.floor(GRID_SIZE / 2)) ||
        ((y === 3 || y === GRID_SIZE - 4) && x > 2 && x < GRID_SIZE - 3 && x !== Math.floor(GRID_SIZE / 2))
      ) {
        continue; // walls
      }
      // Add block (collectible)
      if (Math.random() > 0.2) {
        blocks.push({ x, y });
      }
    }
  }
  return blocks;
};

// Ghost AI - simple chase
const moveGhost = (ghost: Position, player: Position, walls: Position[]): Position => {
  const possibleMoves = [
    { x: ghost.x + 1, y: ghost.y },
    { x: ghost.x - 1, y: ghost.y },
    { x: ghost.x, y: ghost.y + 1 },
    { x: ghost.x, y: ghost.y - 1 },
  ].filter(pos => 
    pos.x >= 0 && pos.x < GRID_SIZE &&
    pos.y >= 0 && pos.y < GRID_SIZE &&
    !walls.some(w => w.x === pos.x && w.y === pos.y)
  );

  if (possibleMoves.length === 0) return ghost;

  // Chase player with some randomness
  if (Math.random() > 0.3) {
    possibleMoves.sort((a, b) => {
      const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
      const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
      return distA - distB;
    });
    return possibleMoves[0];
  }

  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};

// Player component
const Player: React.FC<{ position: Position; direction: Direction }> = ({ position, direction }) => {
  const mouthOpen = useSharedValue(0);

  useEffect(() => {
    mouthOpen.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = direction === 'RIGHT' ? 0 : direction === 'DOWN' ? 90 : direction === 'LEFT' ? 180 : 270;
    return {
      transform: [
        { translateX: position.x * CELL_SIZE },
        { translateY: position.y * CELL_SIZE },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.cell, styles.player, animatedStyle]}>
      <View style={styles.playerBody}>
        <View style={styles.playerEye} />
      </View>
    </Animated.View>
  );
};

// Ghost component
const Ghost: React.FC<{ position: Position; color: string; index: number }> = ({ position, color, index }) => {
  const wobble = useSharedValue(0);

  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 200 + index * 50 }),
        withTiming(-3, { duration: 200 + index * 50 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.x * CELL_SIZE + wobble.value },
      { translateY: position.y * CELL_SIZE },
    ],
  }));

  return (
    <Animated.View style={[styles.cell, styles.ghost, { backgroundColor: color }, animatedStyle]}>
      <View style={styles.ghostEyes}>
        <View style={styles.ghostEye} />
        <View style={styles.ghostEye} />
      </View>
      <View style={styles.ghostBottom}>
        <View style={styles.ghostWave} />
        <View style={styles.ghostWave} />
        <View style={styles.ghostWave} />
      </View>
    </Animated.View>
  );
};

// Block (collectible)
const Block: React.FC<{ position: Position; isChain?: boolean }> = ({ position, isChain }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isChain) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [isChain]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.x * CELL_SIZE + CELL_SIZE / 4 },
      { translateY: position.y * CELL_SIZE + CELL_SIZE / 4 },
      { scale: pulse.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        isChain && styles.chainBlock,
        animatedStyle,
      ]}
    />
  );
};

// Chain Trail
const ChainSegment: React.FC<{ position: Position; index: number }> = ({ position, index }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 20)}
      style={[
        styles.cell,
        styles.chainSegment,
        {
          left: position.x * CELL_SIZE,
          top: position.y * CELL_SIZE,
          opacity: 0.3 + (index * 0.02),
        },
      ]}
    />
  );
};

export default function BlockMuncherGame() {
  const router = useRouter();
  const { profile, updateScore, mintBadge, addXP, highScores } = useGameStore();
  
  // Audio hook for game sounds and music
  const { 
    playCollect, playHit, playMove, playGameStart, playGameOver, 
    playLevelUp, playPowerup 
  } = useGameAudio({ musicTrack: 'action' });

  // Power-up effects hook
  const powerUps = usePowerUpEffects();
  
  // Character bonus hook - for score multipliers
  const { 
    hasBonus, 
    bonusPercent, 
    applyBonus, 
    getBonusPoints,
    recordGame,
    abilityIcon,
    abilityName 
  } = useCharacterBonus('block-muncher');
  
  // Character dialogue state
  const [showIntroDialogue, setShowIntroDialogue] = useState(false);
  const { getSelectedCharacter } = useCharacterStore();
  const selectedCharacter = getSelectedCharacter();
  
  // Function to actually start gameplay (called after dialogue)
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    powerUps.resetSession();
    startTimeRef.current = Date.now();
    playGameStart();
  }, [playGameStart]);

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  
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
  const [lives, setLives] = useState(3);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 7, y: 7 });
  const [playerDir, setPlayerDir] = useState<Direction>('RIGHT');
  const [blocks, setBlocks] = useState<Position[]>([]);
  const [chain, setChain] = useState<Position[]>([]);
  const [ghosts, setGhosts] = useState<Position[]>([
    { x: 1, y: 1 },
    { x: GRID_SIZE - 2, y: 1 },
    { x: 1, y: GRID_SIZE - 2 },
  ]);
  const [walls] = useState<Position[]>([
    // Create some walls
    ...Array(GRID_SIZE).fill(0).flatMap((_, i) => [
      { x: 3, y: i > 2 && i < GRID_SIZE - 3 && i !== 7 ? i : -1 },
      { x: GRID_SIZE - 4, y: i > 2 && i < GRID_SIZE - 3 && i !== 7 ? i : -1 },
    ]).filter(w => w.y !== -1),
  ]);
  
  // Blockchain collectibles
  const [bqoTokens, setBqoTokens] = useState<Position[]>([]);
  const [nftGems, setNftGems] = useState<{pos: Position; rarity: 'common' | 'rare' | 'epic' | 'legendary'}[]>([]);
  const [gamePowerups, setGamePowerups] = useState<{pos: Position; type: 'shield' | 'speed' | 'magnet' | 'multiplier'}[]>([]);
  const [bqoCollected, setBqoCollected] = useState(0);
  const [showTokenEffect, setShowTokenEffect] = useState<{x: number; y: number; amount: number} | null>(null);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const previousHighScore = useRef<number>(0);

  // Generate blockchain collectibles
  const generateBlockchainItems = useCallback(() => {
    // Spawn BQO tokens randomly
    const tokens: Position[] = [];
    for (let i = 0; i < 5; i++) {
      tokens.push({
        x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
        y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
      });
    }
    setBqoTokens(tokens);
    
    // Spawn NFT gems (rare items)
    const gems: {pos: Position; rarity: 'common' | 'rare' | 'epic' | 'legendary'}[] = [];
    const rarities: ('common' | 'rare' | 'epic' | 'legendary')[] = ['common', 'rare', 'epic', 'legendary'];
    for (let i = 0; i < 3; i++) {
      gems.push({
        pos: {
          x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
          y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
        },
        rarity: rarities[Math.floor(Math.random() * rarities.length)],
      });
    }
    setNftGems(gems);
    
    // Spawn powerups
    const powerupTypes: ('shield' | 'speed' | 'magnet' | 'multiplier')[] = ['shield', 'speed', 'magnet', 'multiplier'];
    const pups: {pos: Position; type: 'shield' | 'speed' | 'magnet' | 'multiplier'}[] = [];
    for (let i = 0; i < 2; i++) {
      pups.push({
        pos: {
          x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
          y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
        },
        type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
      });
    }
    setGamePowerups(pups);
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setPlayerPos({ x: 7, y: 7 });
    setPlayerDir('RIGHT');
    setBlocks(generateBlocks());
    setChain([]);
    setGhosts([
      { x: 1, y: 1 },
      { x: GRID_SIZE - 2, y: 1 },
      { x: 1, y: GRID_SIZE - 2 },
    ]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setBqoCollected(0);
    generateBlockchainItems();
  }, [generateBlockchainItems]);

  // Start game - shows intro dialogue first
  const startGame = useCallback(() => {
    initGame();
    // Show intro dialogue - game starts when player dismisses it
    setShowIntroDialogue(true);
  }, [initGame]);
  
  // Handle dialogue dismiss - actually start gameplay
  const handleDialogueDismiss = useCallback(() => {
    setShowIntroDialogue(false);
    beginGameplay();
  }, [beginGameplay]);

  // Move player
  const movePlayer = useCallback((dir: Direction) => {
    if (gameState !== 'playing') return;

    setPlayerDir(dir);
    playMove();
    const delta = DIRECTIONS[dir];
    
    setPlayerPos(prev => {
      const newX = prev.x + delta.x;
      const newY = prev.y + delta.y;
      
      // Bounds check
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        return prev;
      }
      
      // Wall check
      if (walls.some(w => w.x === newX && w.y === newY)) {
        return prev;
      }
      
      return { x: newX, y: newY };
    });
  }, [gameState, walls, playMove]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Check block collection
      setBlocks(prev => {
        const collected = prev.find(b => b.x === playerPos.x && b.y === playerPos.y);
        if (collected) {
          setScore(s => s + 10);
          setChain(c => [...c, { ...playerPos }]);
          playCollect();
          if (Platform.OS !== 'web') GameHaptics.light();
          return prev.filter(b => !(b.x === playerPos.x && b.y === playerPos.y));
        }
        return prev;
      });
      
      // Check BQO token collection
      setBqoTokens(prev => {
        const collected = prev.find(t => t.x === playerPos.x && t.y === playerPos.y);
        if (collected) {
          setScore(s => s + 50);
          setBqoCollected(c => c + 1);
          setShowTokenEffect({ x: playerPos.x, y: playerPos.y, amount: 1 });
          playPowerup();
          if (Platform.OS !== 'web') Vibration.vibrate(30);
          setTimeout(() => setShowTokenEffect(null), 800);
          return prev.filter(t => !(t.x === playerPos.x && t.y === playerPos.y));
        }
        return prev;
      });
      
      // Check NFT gem collection
      setNftGems(prev => {
        const collected = prev.find(g => g.pos.x === playerPos.x && g.pos.y === playerPos.y);
        if (collected) {
          const points = collected.rarity === 'legendary' ? 500 : 
                        collected.rarity === 'epic' ? 200 : 
                        collected.rarity === 'rare' ? 100 : 25;
          setScore(s => s + points);
          playLevelUp();
          if (Platform.OS !== 'web') GameHaptics.medium();
          return prev.filter(g => !(g.pos.x === playerPos.x && g.pos.y === playerPos.y));
        }
        return prev;
      });
      
      // Check powerup collection
      setGamePowerups(prev => {
        const collected = prev.find(p => p.pos.x === playerPos.x && p.pos.y === playerPos.y);
        if (collected) {
          playPowerup();
          if (Platform.OS !== 'web') Vibration.vibrate(40);
          // Apply powerup effect based on type
          if (collected.type === 'multiplier') {
            setScore(s => s + 100);
          } else if (collected.type === 'shield') {
            setLives(l => Math.min(l + 1, 5));
          }
          return prev.filter(p => !(p.pos.x === playerPos.x && p.pos.y === playerPos.y));
        }
        return prev;
      });

      // Move ghosts
      setGhosts(prev => prev.map(ghost => moveGhost(ghost, playerPos, walls)));

      // Check ghost collision
      const hitGhost = ghosts.some(g => g.x === playerPos.x && g.y === playerPos.y);
      if (hitGhost) {
        playHit();
        setLives(l => {
          if (l <= 1) {
            playGameOver();
            // Check if high score was beaten
            const currentHighScore = highScores?.['block-muncher'] || 0;
            previousHighScore.current = currentHighScore;
            if (score > currentHighScore) {
              setHighScoreBeaten(true);
            }
            setGameState('rewards'); // Show rewards first!
            return 0;
          }
          // Reset player position
          setPlayerPos({ x: 7, y: 7 });
          if (Platform.OS !== 'web') GameHaptics.error();
          return l - 1;
        });
      }

      // Check victory
      if (blocks.length === 0) {
        playLevelUp();
        setLevel(l => l + 1);
        setBlocks(generateBlocks());
        setScore(s => s + 100); // Level bonus
      }
    }, 200 - level * 10);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerPos, ghosts, blocks.length, level, walls]);

  // Handle rewards -> gameover transition
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Apply character bonus to score
      const finalScore = applyBonus(score);
      const bonusPoints = getBonusPoints(score);
      
      // Record character game progress
      recordGame(score);
      
      // Update score with bonus applied
      updateScore('block-muncher', finalScore, duration);

      // Submit to leaderboard with final score
      axios.post(`${BACKEND_URL}/api/leaderboard`, {
        player_id: profile.id,
        player_name: profile.username,
        game_id: 'block-muncher',
        score: finalScore,
        duration,
      }).catch(console.error);

      // Award badge for high score (based on final score)
      if (finalScore >= 500) {
        mintBadge({
          name: finalScore >= 1000 ? 'Chain Master' : 'Block Collector',
          description: finalScore >= 1000 
            ? 'Scored 1000+ in Block Muncher!' 
            : 'Scored 500+ in Block Muncher!',
          rarity: finalScore >= 1000 ? 'Epic' : 'Rare',
          gameId: 'block-muncher',
          traits: { score: finalScore, level, chain_length: chain.length, bonus_applied: bonusPoints },
          icon: finalScore >= 1000 ? '🏆' : '⛓️',
        });
      }
    }
  }, [gameState]);
  
  // Handle continue from rewards modal
  const handleRewardsContinue = () => {
    setGameState('gameover');
    setHighScoreBeaten(false);
  };

  // Control buttons
  const ControlButton: React.FC<{ direction: Direction; icon: string }> = ({ direction, icon }) => (
    <TouchableOpacity
      style={styles.controlButton}
      onPress={() => movePlayer(direction)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={32} color={COLORS.chainGold} />
    </TouchableOpacity>
  );

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
          goal={`Build a ${10 + level * 5} block chain!`}
          gameId="block-muncher"
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
          <PixelText size="lg" color={COLORS.chainGold} glow>{score}</PixelText>
          {hasBonus && (
            <Text style={styles.bonusIndicator}>
              {abilityIcon} +{bonusPercent}%
            </Text>
          )}
        </View>
        
        <View style={styles.livesContainer}>
          {Array(lives).fill(0).map((_, i) => (
            <PixelText key={i} size="md">💛</PixelText>
          ))}
        </View>
        
        <View style={styles.levelContainer}>
          <PixelText size="xs" color={COLORS.textSecondary}>LVL</PixelText>
          <PixelText size="md" color={COLORS.blockCyan}>{level}</PixelText>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameContainer}>
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Chain trail */}
          {chain.map((pos, i) => (
            <ChainLink key={`chain-${i}`} x={pos.x} y={pos.y} cellSize={CELL_SIZE} index={i} />
          ))}
          
          {/* Walls */}
          {walls.map((wall, i) => (
            <View
              key={`wall-${i}`}
              style={[
                styles.cell,
                styles.wall,
                { left: wall.x * CELL_SIZE, top: wall.y * CELL_SIZE },
              ]}
            />
          ))}
          
          {/* Blocks */}
          {blocks.map((block, i) => (
            <Block key={`block-${i}`} position={block} />
          ))}
          
          {/* BQO Tokens */}
          {bqoTokens.map((token, i) => (
            <BQOToken 
              key={`bqo-${i}`} 
              x={token.x} 
              y={token.y} 
              cellSize={CELL_SIZE}
              size={CELL_SIZE * 0.7}
              variant={i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}
            />
          ))}
          
          {/* NFT Gems */}
          {nftGems.map((gem, i) => (
            <NFTGem 
              key={`gem-${i}`} 
              x={gem.pos.x} 
              y={gem.pos.y} 
              cellSize={CELL_SIZE}
              size={CELL_SIZE * 0.6}
              rarity={gem.rarity}
            />
          ))}
          
          {/* Powerups */}
          {gamePowerups.map((pup, i) => (
            <WalletPowerup 
              key={`pup-${i}`} 
              x={pup.pos.x} 
              y={pup.pos.y} 
              cellSize={CELL_SIZE}
              type={pup.type}
            />
          ))}
          
          {/* Token collect effect */}
          {showTokenEffect && (
            <TokenCollectEffect 
              x={showTokenEffect.x} 
              y={showTokenEffect.y} 
              cellSize={CELL_SIZE}
              amount={showTokenEffect.amount}
            />
          )}
          
          {/* Ghosts */}
          {ghosts.map((ghost, i) => (
            <Ghost
              key={`ghost-${i}`}
              position={ghost}
              color={['#FF0000', '#00FFFF', '#FFB8FF'][i]}
              index={i}
            />
          ))}
          
          {/* Player */}
          <Player position={playerPos} direction={playerDir} />
        </View>
        
        {/* BQO Counter */}
        <View style={styles.bqoCounter}>
          <PixelText size="xs" color={COLORS.neonYellow}>BQO TOKENS</PixelText>
          <PixelText size="lg" color={COLORS.neonPink} glow>{bqoCollected}</PixelText>
        </View>

        {/* Web3 Info */}
        <View style={styles.infoBox}>
          <PixelText size="xs" color={COLORS.blockCyan}>
            🔗 {GAME_MECHANICS.concept.toUpperCase()}:
          </PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            {getRandomTip('block-muncher')}
          </PixelText>
          <PixelText size="xs" color={COLORS.chainGold}>
            Chain Length: {chain.length} blocks 🔗
          </PixelText>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <ControlButton direction="UP" icon="arrow-up" />
        </View>
        <View style={styles.controlRow}>
          <ControlButton direction="LEFT" icon="arrow-back" />
          <View style={styles.controlSpacer} />
          <ControlButton direction="RIGHT" icon="arrow-forward" />
        </View>
        <View style={styles.controlRow}>
          <ControlButton direction="DOWN" icon="arrow-down" />
        </View>
      </View>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <View style={styles.overlay}>
          <VFXLayer type="pixel-chain-rain" intensity={0.6} />
          <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
            <PixelText size="xxl" color={COLORS.chainGold} glow style={styles.menuTitle}>
              {GAME_CONFIG.title.toUpperCase()}
            </PixelText>
            <PixelText size="md" style={styles.menuIcon}>{GAME_CONFIG.icon}</PixelText>
            
            {/* Instructions */}
            <View style={styles.instructionBox}>
              <PixelText size="xs" color={COLORS.neonCyan}>HOW TO PLAY</PixelText>
              <PixelText size="xs" color={COLORS.textSecondary} style={styles.instructionText}>
                {GAME_CONFIG.instructions}
              </PixelText>
            </View>
            
            {/* Controls */}
            <View style={styles.controlsInfo}>
              <PixelText size="xs" color={COLORS.neonYellow}>CONTROLS</PixelText>
              <PixelText size="sm" color={COLORS.chainGold} glow>
                {GAME_CONFIG.controls}
              </PixelText>
            </View>
            
            {/* Difficulty */}
            <PixelText size="xs" color={
              GAME_CONFIG.difficulty === 'Easy' ? '#32CD32' :
              GAME_CONFIG.difficulty === 'Medium' ? '#FFD700' : '#FF4500'
            }>
              {GAME_CONFIG.difficulty === 'Easy' ? '★☆☆' :
               GAME_CONFIG.difficulty === 'Medium' ? '★★☆' : '★★★'} {GAME_CONFIG.difficulty}
            </PixelText>
            
            <PixelButton
              title="▶ PLAY"
              onPress={startGame}
              color={COLORS.chainGold}
              size="lg"
              style={{ marginTop: 20 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Game Rewards Modal - Shows XP with faction bonus! */}
      <GameRewardsModal
        visible={gameState === 'rewards'}
        gameId="block-muncher"
        gameName="Block Muncher"
        score={score}
        baseXP={Math.floor(score / 10)}
        isNewHighScore={highScoreBeaten}
        onContinue={handleRewardsContinue}
      />

      {/* Game Over - Using RektScreen */}
      <RektScreen
        visible={gameState === 'gameover'}
        score={score}
        reason={`Chain: ${chain.length} blocks | Level: ${level}`}
        onRetry={startGame}
        onQuit={() => router.push('/')}
      />
      
      {/* Character Story Dialogue - Shows before game starts */}
      <CharacterDialogue
        gameId="block-muncher"
        visible={showIntroDialogue}
        onDismiss={handleDialogueDismiss}
      />
    </ScreenShake>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  bonusIndicator: {
    fontSize: 10,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  livesContainer: {
    flexDirection: 'row',
  },
  levelContainer: {
    alignItems: 'center',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gameArea: {
    backgroundColor: COLORS.bgMedium,
    borderWidth: 2,
    borderColor: COLORS.chainGold,
    position: 'relative',
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  player: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerBody: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: COLORS.chainGold,
    borderRadius: CELL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  playerEye: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.bgDark,
    borderRadius: 2,
  },
  ghost: {
    borderTopLeftRadius: CELL_SIZE / 2,
    borderTopRightRadius: CELL_SIZE / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    zIndex: 5,
  },
  ghostEyes: {
    flexDirection: 'row',
    gap: 4,
  },
  ghostEye: {
    width: 4,
    height: 6,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  ghostBottom: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
  },
  ghostWave: {
    width: CELL_SIZE / 3,
    height: 4,
    backgroundColor: 'inherit',
    borderRadius: 4,
  },
  block: {
    position: 'absolute',
    width: CELL_SIZE / 2,
    height: CELL_SIZE / 2,
    backgroundColor: COLORS.blockCyan,
    borderRadius: 2,
  },
  chainBlock: {
    backgroundColor: COLORS.chainGold,
  },
  chainSegment: {
    backgroundColor: COLORS.chainGold,
    opacity: 0.3,
    borderRadius: 2,
  },
  wall: {
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
  },
  infoBox: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    maxWidth: GAME_WIDTH,
  },
  bqoCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neonPink + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.neonPink + '40',
    gap: 12,
  },
  controlsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.chainGold,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  controlSpacer: {
    width: 60,
    margin: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  menuContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.chainGold,
    maxWidth: 320,
  },
  menuTitle: {
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 60,
    marginVertical: 16,
  },
  menuSubtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  menuHint: {
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    width: '100%',
  },
  instructionText: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  controlsInfo: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  badgeEarned: {
    backgroundColor: COLORS.success + '30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  gameOverButtons: {
    gap: 12,
    marginTop: 24,
  },
});
