// BlockQuest Official - Chain Builder Full Game
// 🐍 Snake-style blockchain building game!
// Full standalone version with enhanced controls & visuals

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../../src/constants/crtTheme';
import { CRTGlowBorder, CRTScanlines, PixelRain } from '../../src/components/CRTEffects';
import { PixelText } from '../../src/components/PixelText';
import { useGameStore } from '../../src/store/gameStore';
import audioManager from '../../src/utils/AudioManager';
import { 
  useKeyboardControls, 
  EnhancedDPad, 
  NeonText, 
  ScoreDisplay,
  GameHeader,
  CollectEffect,
  GameProgressBar,
  GameInstructions,
} from '../../src/utils/GameControls';
import { 
  GameHaptics, 
  ScreenShake, 
  ComboDisplay, 
  useComboSystem,
  ParticleBurst,
} from '../../src/utils/GameEnhancements';
import { ConfettiEffect } from '../../src/components/ConfettiEffect';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game configuration - larger grid for full game
const GRID_COLS = 14;
const GRID_ROWS = 20;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 48) / GRID_COLS, 24);
const GAME_WIDTH = GRID_COLS * CELL_SIZE;
const GAME_HEIGHT = GRID_ROWS * CELL_SIZE;

// Directions
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

type Direction = keyof typeof DIRECTIONS;
type Position = { x: number; y: number };
type GameState = 'intro' | 'playing' | 'paused' | 'gameover' | 'achievement' | 'complete';

// Block colors for the chain
const CHAIN_COLORS = [
  '#FFD700', // Gold
  '#00FF88', // Green
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FF6B6B', // Coral
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#F97316', // Orange
];

// Achievements
const ACHIEVEMENTS = [
  { length: 5, name: 'First Links!', icon: '🔗', xp: 25 },
  { length: 10, name: 'Sam Unlocked!', icon: '🛡️', xp: 50, hero: 'Sam' },
  { length: 20, name: 'Chain Master!', icon: '⛓️', xp: 100 },
  { length: 30, name: 'Blockchain Pro!', icon: '🏆', xp: 200 },
  { length: 50, name: 'LEGENDARY!', icon: '👑', xp: 500 },
];

export default function ChainBuilderGame() {
  const router = useRouter();
  const { submitScore, addXP, mintBadge } = useGameStore();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('intro');
  const [chain, setChain] = useState<Position[]>([{ x: 7, y: 10 }]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [block, setBlock] = useState<Position>({ x: 3, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(180);
  const [currentAchievement, setCurrentAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // Enhanced visual state
  const [shakeCount, setShakeCount] = useState(0);
  const [collectEffectPos, setCollectEffectPos] = useState({ x: 0, y: 0 });
  const [collectTrigger, setCollectTrigger] = useState(0);
  const [particleBurst, setParticleBurst] = useState({ x: 0, y: 0, trigger: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Combo system
  const { combo, showCombo, incrementCombo, resetCombo, getMultiplier } = useComboSystem(2000);
  
  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const scoreScale = useSharedValue(1);
  const chainGlow = useSharedValue(0);

  // Score animation
  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  // Chain glow effect when combo is active
  useEffect(() => {
    if (combo >= 3) {
      chainGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.5, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      chainGlow.value = withTiming(0, { duration: 200 });
    }
  }, [combo]);

  // Keyboard controls
  useKeyboardControls({
    onDirection: (dir) => {
      if (gameState === 'playing') {
        const dirMap: Record<string, Direction> = {
          up: 'UP',
          down: 'DOWN',
          left: 'LEFT',
          right: 'RIGHT',
        };
        if (dirMap[dir]) {
          handleDirectionChange(dirMap[dir]);
        }
      } else if (gameState === 'intro' && (dir === 'action')) {
        startGame();
      } else if (gameState === 'gameover' && (dir === 'action')) {
        restartGame();
      } else if (gameState === 'achievement' && (dir === 'action')) {
        continueGame();
      }
    },
    enabled: gameState !== 'paused',
  });

  // Spawn a new block to collect
  const spawnBlock = useCallback(() => {
    let newX, newY;
    let attempts = 0;
    do {
      newX = Math.floor(Math.random() * GRID_COLS);
      newY = Math.floor(Math.random() * GRID_ROWS);
      attempts++;
    } while (chain.some(seg => seg.x === newX && seg.y === newY) && attempts < 100);
    
    setBlock({ x: newX, y: newY });
  }, [chain]);

  // Check achievements
  const checkAchievements = useCallback((chainLength: number) => {
    for (const achievement of ACHIEVEMENTS) {
      if (chainLength >= achievement.length && !unlockedAchievements.includes(achievement.name)) {
        setUnlockedAchievements(prev => [...prev, achievement.name]);
        setCurrentAchievement(achievement);
        setGameState('achievement');
        audioManager.playSound('victory');
        
        // Add XP
        addXP(achievement.xp);
        
        // If hero unlock
        if (achievement.hero) {
          mintBadge({
            name: `${achievement.hero} - Chain Guardian`,
            description: `Built a ${chainLength}-block chain in Chain Builder!`,
            rarity: 'Rare',
            gameId: 'chain-builder',
            traits: { chainLength, hero: achievement.hero },
            icon: achievement.icon,
          });
        }
        
        break;
      }
    }
  }, [unlockedAchievements, addXP, mintBadge]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setChain(prevChain => {
      setDirection(nextDirection);
      const dir = DIRECTIONS[nextDirection];
      
      const head = prevChain[0];
      let newHead = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Wrap around edges
      if (newHead.x < 0) newHead.x = GRID_COLS - 1;
      if (newHead.x >= GRID_COLS) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_ROWS - 1;
      if (newHead.y >= GRID_ROWS) newHead.y = 0;

      // Check self-collision
      if (prevChain.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameState('gameover');
        audioManager.playSound('damage');
        GameHaptics.error();
        setShakeCount(prev => prev + 1);
        resetCombo();
        if (score > highScore) {
          setHighScore(score);
        }
        submitScore('chain-builder', score);
        return prevChain;
      }

      let newChain: Position[];
      if (newHead.x === block.x && newHead.y === block.y) {
        newChain = [newHead, ...prevChain];
        
        // Apply combo multiplier to points
        const basePoints = newChain.length * 10;
        const comboMultiplier = getMultiplier();
        const points = Math.floor(basePoints * comboMultiplier);
        setScore(prev => prev + points);
        
        // Increment combo
        incrementCombo();
        
        // Visual feedback
        scoreScale.value = withSequence(
          withSpring(1.3),
          withSpring(1)
        );
        
        // Show collect effect at block position
        setCollectEffectPos({
          x: block.x * CELL_SIZE + CELL_SIZE / 2,
          y: block.y * CELL_SIZE + CELL_SIZE / 2,
        });
        setCollectTrigger(prev => prev + 1);
        
        // Particle burst for combos
        if (combo >= 2) {
          setParticleBurst({
            x: block.x * CELL_SIZE + CELL_SIZE / 2,
            y: block.y * CELL_SIZE + CELL_SIZE / 2,
            trigger: Date.now(),
          });
          GameHaptics.medium();
        } else {
          GameHaptics.light();
        }
        
        audioManager.playSound('collect');
        setTimeout(spawnBlock, 0);
        checkAchievements(newChain.length);
        setSpeed(prev => Math.max(60, prev - 2));
      } else {
        newChain = [newHead, ...prevChain.slice(0, -1)];
      }

      return newChain;
    });
  }, [gameState, nextDirection, block, score, highScore, spawnBlock, checkAchievements, submitScore, combo, incrementCombo, resetCombo, getMultiplier]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, speed, gameLoop]);

  // Handle direction change
  const handleDirectionChange = (newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    
    if (newDir !== opposites[direction]) {
      setNextDirection(newDir);
      audioManager.playSound('click');
    }
  };

  // Start game
  const startGame = () => {
    setChain([{ x: 7, y: 10 }]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(180);
    spawnBlock();
    setGameState('playing');
    audioManager.playSound('powerup');
  };

  // Continue after achievement
  const continueGame = () => {
    setCurrentAchievement(null);
    setGameState('playing');
  };

  // Restart
  const restartGame = () => {
    setUnlockedAchievements([]);
    startGame();
  };

  // Get color for chain segment
  const getChainColor = (index: number) => {
    return CHAIN_COLORS[index % CHAIN_COLORS.length];
  };

  // Render game grid
  const renderGrid = () => {
    const cells = [];
    
    chain.forEach((segment, index) => {
      const isHead = index === 0;
      cells.push(
        <View
          key={`chain-${index}`}
          style={[
            styles.chainSegment,
            {
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              backgroundColor: getChainColor(index),
              borderRadius: isHead ? CELL_SIZE / 4 : 4,
              borderWidth: isHead ? 2 : 1,
              borderColor: isHead ? '#FFF' : getChainColor(index),
            },
          ]}
        >
          {isHead && <Text style={styles.headEmoji}>◆</Text>}
        </View>
      );
    });

    cells.push(
      <Animated.View
        key="block"
        entering={ZoomIn}
        style={[
          styles.collectBlock,
          {
            left: block.x * CELL_SIZE,
            top: block.y * CELL_SIZE,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
          },
        ]}
      >
        <Text style={styles.blockEmoji}>💎</Text>
      </Animated.View>
    );

    return cells;
  };

  // Intro screen
  if (gameState === 'intro') {
    return (
      <View style={styles.container}>
        <PixelRain count={15} speed={4000} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <PixelText size="lg" color={CRT_COLORS.accentGold} glow>
              ⛓️ CHAIN BUILDER
            </PixelText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.introContent}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={styles.introIcon}>🐍</Text>
              <Text style={styles.introTitle}>BUILD THE CHAIN!</Text>
              <Text style={styles.introSubtitle}>Snake meets Blockchain</Text>
            </Animated.View>
            
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionItem}>🎮 Use D-PAD to move your chain</Text>
              <Text style={styles.instructionItem}>💎 Collect gems to grow longer</Text>
              <Text style={styles.instructionItem}>🔗 Build an unbreakable chain!</Text>
              <Text style={styles.instructionItem}>⚠️ Don't crash into yourself!</Text>
              <Text style={styles.instructionItem}>🛡️ Get 10 blocks to unlock SAM!</Text>
            </View>
            
            {highScore > 0 && (
              <Text style={styles.highScoreText}>🏆 High Score: {highScore}</Text>
            )}
            
            <TouchableOpacity style={styles.playBtn} onPress={startGame}>
              <Text style={styles.playBtnText}>▶ START BUILDING</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Achievement popup
  if (gameState === 'achievement' && currentAchievement) {
    return (
      <View style={styles.container}>
        <PixelRain count={25} speed={3000} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.achievementContent}>
            <Animated.View entering={ZoomIn} style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>{currentAchievement.icon}</Text>
              <Text style={styles.achievementTitle}>🎉 ACHIEVEMENT!</Text>
              <Text style={styles.achievementName}>{currentAchievement.name}</Text>
              {currentAchievement.hero && (
                <View style={styles.heroUnlock}>
                  <Text style={styles.heroUnlockText}>
                    🛡️ {currentAchievement.hero} Unlocked!
                  </Text>
                  <Text style={styles.heroDesc}>Protects from hacks!</Text>
                </View>
              )}
              <Text style={styles.achievementReward}>+{currentAchievement.xp} XP</Text>
              
              <TouchableOpacity style={styles.continueBtn} onPress={continueGame}>
                <Text style={styles.continueBtnText}>▶ CONTINUE</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Game over screen
  if (gameState === 'gameover') {
    return (
      <View style={styles.container}>
        <PixelRain count={10} speed={5000} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.gameOverContent}>
            <Animated.View entering={ZoomIn} style={styles.gameOverCard}>
              <Text style={styles.gameOverEmoji}>💔</Text>
              <Text style={styles.gameOverTitle}>CHAIN BROKEN!</Text>
              <Text style={styles.finalScore}>SCORE: {score}</Text>
              <Text style={styles.chainLength}>{chain.length} Blocks Built</Text>
              
              {score === highScore && score > 0 && (
                <Text style={styles.newHighScore}>🎉 NEW HIGH SCORE!</Text>
              )}
              
              <View style={styles.earnedBadges}>
                {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.name)).map(a => (
                  <View key={a.name} style={styles.earnedBadge}>
                    <Text style={styles.earnedIcon}>{a.icon}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.lessonBox}>
                <Text style={styles.lessonTitle}>💡 Blockchain Fact:</Text>
                <Text style={styles.lessonText}>
                  Like your chain, real blockchains are unbreakable because each block is 
                  cryptographically linked to the previous one!
                </Text>
              </View>
              
              <View style={styles.gameOverBtns}>
                <TouchableOpacity style={styles.retryBtn} onPress={restartGame}>
                  <Text style={styles.retryBtnText}>🔄 RETRY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
                  <Text style={styles.exitBtnText}>🏠 EXIT</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Main game screen
  return (
    <View style={styles.container}>
      <CRTScanlines opacity={0.04} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <PixelText size="md" color={CRT_COLORS.accentGold} glow>
            ⛓️ CHAIN BUILDER
          </PixelText>
          <Animated.View style={[styles.scoreBox, scoreAnimStyle]}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </Animated.View>
        </View>
        
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CHAIN</Text>
            <Text style={styles.statValue}>{chain.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (chain.length / 50) * 100)}%` }]} />
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GOAL</Text>
            <Text style={styles.statValue}>50</Text>
          </View>
        </View>

        {/* Game Area */}
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.gameAreaBorder}>
          <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
            {renderGrid()}
          </View>
        </CRTGlowBorder>

        {/* D-Pad Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.dpad}>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadUp]}
              onPress={() => handleDirectionChange('UP')}
            >
              <Text style={styles.dpadText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.dpadMiddle}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadLeft]}
                onPress={() => handleDirectionChange('LEFT')}
              >
                <Text style={styles.dpadText}>◀</Text>
              </TouchableOpacity>
              <View style={styles.dpadCenter} />
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadRight]}
                onPress={() => handleDirectionChange('RIGHT')}
              >
                <Text style={styles.dpadText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadDown]}
              onPress={() => handleDirectionChange('DOWN')}
            >
              <Text style={styles.dpadText}>▼</Text>
            </TouchableOpacity>
          </View>
          
          {/* Earned badges */}
          {unlockedAchievements.length > 0 && (
            <View style={styles.liveBadges}>
              {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.name)).map(a => (
                <View key={a.name} style={styles.liveBadge}>
                  <Text style={styles.liveBadgeIcon}>{a.icon}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: CRT_COLORS.primary,
  },
  placeholder: {
    width: 60,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold + '60',
  },
  scoreLabel: {
    fontSize: 8,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 8,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statValue: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 4,
  },
  
  // Game area
  gameAreaBorder: {
    alignSelf: 'center',
  },
  gameArea: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  
  // Chain segment
  chainSegment: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headEmoji: {
    fontSize: 10,
    color: '#000',
  },
  
  // Block to collect
  collectBlock: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  blockEmoji: {
    fontSize: CELL_SIZE - 4,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
  },
  dpad: {
    alignItems: 'center',
  },
  dpadMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadButton: {
    width: 52,
    height: 52,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '60',
  },
  dpadUp: {
    marginBottom: 4,
  },
  dpadDown: {
    marginTop: 4,
  },
  dpadLeft: {
    marginRight: 4,
  },
  dpadRight: {
    marginLeft: 4,
  },
  dpadCenter: {
    width: 24,
    height: 24,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
  },
  dpadText: {
    fontSize: 20,
    color: CRT_COLORS.primary,
    fontWeight: 'bold',
  },
  
  // Live badges
  liveBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: 120,
  },
  liveBadge: {
    width: 36,
    height: 36,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold,
  },
  liveBadgeIcon: {
    fontSize: 16,
  },
  
  // Intro screen
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  introIcon: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 22,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionsBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  instructionItem: {
    fontSize: 12,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 4,
  },
  highScoreText: {
    fontSize: 14,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  playBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  playBtnText: {
    fontSize: 16,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Achievement screen
  achievementContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    width: '100%',
    maxWidth: 320,
  },
  achievementEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 20,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 16,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  heroUnlock: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  heroUnlockText: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  heroDesc: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  achievementReward: {
    fontSize: 18,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  continueBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  continueBtnText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Game over screen
  gameOverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameOverCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    width: '100%',
    maxWidth: 340,
  },
  gameOverEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  gameOverTitle: {
    fontSize: 20,
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 28,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chainLength: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  newHighScore: {
    fontSize: 14,
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  earnedBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  earnedBadge: {
    width: 36,
    height: 36,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold,
  },
  earnedIcon: {
    fontSize: 16,
  },
  lessonBox: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
    width: '100%',
  },
  lessonTitle: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lessonText: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  gameOverBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  exitBtn: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textSecondary,  // Brightened border
  },
  exitBtnText: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
