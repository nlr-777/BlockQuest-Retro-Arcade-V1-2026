// BlockQuest Official - Chain Builder Mini Game (Snake Style)
// 🐍 Build an unbreakable chain! Snake game meets blockchain!
// Can be embedded in welcome screen as a teaser

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { CRTGlowBorder, CRTScanlines } from './CRTEffects';
import audioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game configuration
const GRID_COLS = 12;
const GRID_ROWS = 18;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 80) / GRID_COLS, 22);
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
type GameState = 'intro' | 'playing' | 'paused' | 'gameover' | 'achievement';

// Block colors for the chain
const CHAIN_COLORS = [
  '#FFD700', // Gold
  '#00FF88', // Green
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FF6B6B', // Coral
  '#A855F7', // Purple
];

// Achievements
const ACHIEVEMENTS = [
  { length: 5, name: 'First Links!', icon: '🔗', xp: 25 },
  { length: 10, name: 'Chain Starter!', icon: '⛓️', xp: 50 },
  { length: 20, name: 'Chain Master!', icon: '🏆', xp: 100 },
  { length: 30, name: 'Blockchain Pro!', icon: '👑', xp: 200 },
];

interface ChainBuilderMiniProps {
  visible: boolean;
  onClose: () => void;
  onScoreUpdate?: (score: number) => void;
  onGameComplete?: (score: number, chainLength: number) => void;
}

export const ChainBuilderMini: React.FC<ChainBuilderMiniProps> = ({
  visible,
  onClose,
  onScoreUpdate,
  onGameComplete,
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('intro');
  const [chain, setChain] = useState<Position[]>([{ x: 6, y: 9 }]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [block, setBlock] = useState<Position>({ x: 3, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(200);
  const [currentAchievement, setCurrentAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const scoreScale = useSharedValue(1);

  // Score animation
  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  // Spawn a new block to collect
  const spawnBlock = useCallback(() => {
    let newX: number = 0;
    let newY: number = 0;
    do {
      newX = Math.floor(Math.random() * GRID_COLS);
      newY = Math.floor(Math.random() * GRID_ROWS);
    } while (chain.some(seg => seg.x === newX && seg.y === newY));
    
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
        break;
      }
    }
  }, [unlockedAchievements]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setChain(prevChain => {
      // Update direction
      setDirection(nextDirection);
      const dir = DIRECTIONS[nextDirection];
      
      // Calculate new head position
      const head = prevChain[0];
      let newHead = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Wrap around edges (makes game easier for kids)
      if (newHead.x < 0) newHead.x = GRID_COLS - 1;
      if (newHead.x >= GRID_COLS) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_ROWS - 1;
      if (newHead.y >= GRID_ROWS) newHead.y = 0;

      // Check self-collision (game over)
      if (prevChain.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameState('gameover');
        try {
          audioManager.playSound('damage');
        } catch (e) {
          // Audio error - silently ignore
        }
        if (score > highScore) {
          setHighScore(score);
        }
        // Call game complete callback
        onGameComplete?.(score, prevChain.length);
        return prevChain;
      }

      // Check if we collected a block
      let newChain: Position[];
      if (newHead.x === block.x && newHead.y === block.y) {
        // Grow the chain
        newChain = [newHead, ...prevChain];
        
        // Update score
        const points = newChain.length * 10;
        setScore(prev => {
          const newScore = prev + points;
          onScoreUpdate?.(newScore);
          return newScore;
        });
        
        // Animate score
        scoreScale.value = withSequence(
          withSpring(1.3),
          withSpring(1)
        );
        
        // Play sound
        audioManager.playSound('collect');
        
        // Spawn new block
        setTimeout(spawnBlock, 0);
        
        // Check achievements
        checkAchievements(newChain.length);
        
        // Increase speed slightly
        setSpeed(prev => Math.max(80, prev - 3));
      } else {
        // Move normally (remove tail)
        newChain = [newHead, ...prevChain.slice(0, -1)];
      }

      return newChain;
    });
  }, [gameState, nextDirection, block, score, highScore, spawnBlock, checkAchievements, onScoreUpdate, onGameComplete]);

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
    // Prevent reversing direction
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
    setChain([{ x: 6, y: 9 }]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(200);
    spawnBlock();
    setGameState('playing');
    audioManager.playSound('powerup');
  };

  // Continue after achievement
  const continueGame = () => {
    setCurrentAchievement(null);
    setGameState('playing');
  };

  // Restart game
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
    
    // Render chain
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

    // Render block to collect
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
  const renderIntro = () => (
    <Animated.View entering={FadeIn} style={styles.introContainer}>
      <Text style={styles.introTitle}>⛓️ CHAIN BUILDER ⛓️</Text>
      <Text style={styles.introSubtitle}>Snake meets Blockchain!</Text>
      
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionItem}>🎮 Use D-PAD to move</Text>
        <Text style={styles.instructionItem}>💎 Collect blocks to grow</Text>
        <Text style={styles.instructionItem}>🔗 Build the longest chain!</Text>
        <Text style={styles.instructionItem}>⚠️ Don't hit yourself!</Text>
      </View>
      
      {highScore > 0 && (
        <Text style={styles.highScoreText}>🏆 Best: {highScore}</Text>
      )}
      
      <TouchableOpacity style={styles.playButton} onPress={startGame}>
        <Text style={styles.playButtonText}>▶ PLAY</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Game over screen
  const renderGameOver = () => (
    <Animated.View entering={ZoomIn} style={styles.gameOverContainer}>
      <Text style={styles.gameOverTitle}>💔 CHAIN BROKEN!</Text>
      <Text style={styles.finalScore}>SCORE: {score}</Text>
      <Text style={styles.chainLength}>Chain Length: {chain.length} blocks</Text>
      
      {score > highScore - score && score === highScore && (
        <Text style={styles.newHighScore}>🎉 NEW HIGH SCORE!</Text>
      )}
      
      <View style={styles.earnedBadgesRow}>
        {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.name)).map(a => (
          <View key={a.name} style={styles.earnedBadge}>
            <Text style={styles.earnedBadgeIcon}>{a.icon}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.gameOverButtons}>
        <TouchableOpacity style={styles.retryButton} onPress={restartGame}>
          <Text style={styles.retryButtonText}>🔄 RETRY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton} onPress={onClose}>
          <Text style={styles.exitButtonText}>✕ EXIT</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Achievement popup
  const renderAchievement = () => (
    <Animated.View entering={ZoomIn} style={styles.achievementContainer}>
      <Text style={styles.achievementIcon}>{currentAchievement?.icon}</Text>
      <Text style={styles.achievementTitle}>🎉 ACHIEVEMENT!</Text>
      <Text style={styles.achievementName}>{currentAchievement?.name}</Text>
      <Text style={styles.achievementXP}>+{currentAchievement?.xp} XP</Text>
      
      <TouchableOpacity style={styles.continueButton} onPress={continueGame}>
        <Text style={styles.continueButtonText}>▶ CONTINUE</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.gameContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>⛓️ CHAIN BUILDER</Text>
            <Animated.View style={[styles.scoreBox, scoreAnimStyle]}>
              <Text style={styles.scoreValue}>{score}</Text>
            </Animated.View>
          </View>

          {/* Game Area */}
          <CRTGlowBorder color={CRT_COLORS.primary} style={styles.gameAreaBorder}>
            <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
              {gameState === 'intro' && renderIntro()}
              {gameState === 'playing' && renderGrid()}
              {gameState === 'gameover' && renderGameOver()}
              {gameState === 'achievement' && renderAchievement()}
            </View>
          </CRTGlowBorder>

          {/* D-Pad Controls */}
          {gameState === 'playing' && (
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
              
              {/* Chain length indicator */}
              <View style={styles.chainInfo}>
                <Text style={styles.chainLabel}>CHAIN</Text>
                <Text style={styles.chainValue}>{chain.length}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Teaser Thumbnail Component
interface ChainBuilderTeaserProps {
  onPress: () => void;
}

export const ChainBuilderTeaser: React.FC<ChainBuilderTeaserProps> = ({ onPress }) => {
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    pulseAnim.value = withSequence(
      withTiming(1.05, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    );
    
    const interval = setInterval(() => {
      pulseAnim.value = withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.teaserContainer, animStyle]}>
        <View style={styles.teaserGlow} />
        <View style={styles.teaserContent}>
          <Text style={styles.teaserIcon}>⛓️</Text>
          <View style={styles.teaserTextBox}>
            <Text style={styles.teaserTitle}>TRY ME!</Text>
            <Text style={styles.teaserSubtitle}>Chain Builder</Text>
          </View>
          <Text style={styles.teaserPlayIcon}>▶</Text>
        </View>
        <View style={styles.teaserChainPreview}>
          {[0, 1, 2, 3, 4].map(i => (
            <View
              key={i}
              style={[
                styles.teaserBlock,
                { backgroundColor: CHAIN_COLORS[i], marginLeft: i > 0 ? -4 : 0 }
              ]}
            />
          ))}
          <Text style={styles.teaserBlockEmoji}>💎</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 10, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    maxWidth: SCREEN_WIDTH - 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
  },
  closeText: {
    fontSize: 18,
    color: CRT_COLORS.textDim,
  },
  title: {
    fontSize: 14,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  scoreBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold + '60',
  },
  scoreValue: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
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
    fontSize: 8,
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
    fontSize: CELL_SIZE - 6,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  dpad: {
    alignItems: 'center',
  },
  dpadMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadButton: {
    width: 44,
    height: 44,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
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
    width: 20,
    height: 20,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
  },
  dpadText: {
    fontSize: 16,
    color: CRT_COLORS.primary,
    fontWeight: 'bold',
  },
  chainInfo: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chainLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  chainValue: {
    fontSize: 24,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Intro screen
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  introTitle: {
    fontSize: 18,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  instructionsBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 11,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 3,
  },
  highScoreText: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  playButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Game over
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gameOverTitle: {
    fontSize: 18,
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 24,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chainLength: {
    fontSize: 12,
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
  earnedBadgesRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  earnedBadge: {
    width: 32,
    height: 32,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold,
  },
  earnedBadgeIcon: {
    fontSize: 14,
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim,
  },
  exitButtonText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Achievement
  achievementContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  achievementXP: {
    fontSize: 18,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  continueButtonText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Teaser thumbnail
  teaserContainer: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold + '60',
    overflow: 'hidden',
    position: 'relative',
  },
  teaserGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CRT_COLORS.accentGold,
    opacity: 0.15,
  },
  teaserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teaserIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  teaserTextBox: {
    flex: 1,
  },
  teaserTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  teaserSubtitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  teaserPlayIcon: {
    fontSize: 20,
    color: CRT_COLORS.primary,
  },
  teaserChainPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserBlock: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  teaserBlockEmoji: {
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ChainBuilderMini;
