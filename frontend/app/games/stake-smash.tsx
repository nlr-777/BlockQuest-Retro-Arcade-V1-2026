// BlockQuest Official - Power Smash
// Breakout/Arkanoid Style Game - Teaches Energy & Resource Concepts
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  Platform,
  Vibration,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';

import { COLORS } from '../../src/constants/colors';
import { GAMES } from '../../src/constants/games';
import { useGameStore } from '../../src/store/gameStore';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { RektScreen } from '../../src/components/RektScreen';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { RoastHUD } from '../../src/components/RoastHUD';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 14;
const BALL_SIZE = 12;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = (GAME_WIDTH - 20) / BRICK_COLS;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 2;

// Power crystal tiers (brick types) - Kid-friendly terms
const POWER_TIERS = [
  { name: 'Bronze', color: '#CD7F32', points: 10, boost: '⚡1', hits: 1 },
  { name: 'Silver', color: '#C0C0C0', points: 20, boost: '⚡2', hits: 1 },
  { name: 'Gold', color: '#FFD700', points: 30, boost: '⚡3', hits: 2 },
  { name: 'Platinum', color: '#E5E4E2', points: 50, boost: '⚡4', hits: 2 },
  { name: 'Diamond', color: '#B9F2FF', points: 100, boost: '⚡5', hits: 3 },
];

// Power-up types
const POWER_UPS = {
  WIDE_PADDLE: { color: '#00FF00', name: 'Wide Paddle', icon: '↔️' },
  MULTI_BALL: { color: '#FF00FF', name: 'Multi Ball', icon: '⚪' },
  ENERGY_BOOST: { color: '#FFD700', name: 'Energy Boost', icon: '⬆️' },
  SLOW_BALL: { color: '#00BFFF', name: 'Slow Ball', icon: '🐢' },
};

type PowerUpType = keyof typeof POWER_UPS;

interface Brick {
  id: number;
  x: number;
  y: number;
  tier: number;
  hits: number;
  active: boolean;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory' | 'rewards';

export default function PowerSmashGame() {
  const router = useRouter();
  const { submitScore, addBadge } = useGameStore();
  
  // Audio hook
  const { playCollect, playHit, playGameStart, playGameOver, playLevelUp, playPowerup } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [energyStored, setEnergyStored] = useState(0);
  const [powerLevel, setPowerLevel] = useState(0);
  const [combo, setCombo] = useState(0);

  // Game objects
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const ballSpeedRef = useRef(5);

  // Initialize bricks for a level
  const initBricks = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    let id = 0;
    const startY = 40;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        // Higher tiers appear in higher levels and upper rows
        const tierIndex = Math.min(
          Math.floor((BRICK_ROWS - row - 1 + lvl - 1) / 2),
          POWER_TIERS.length - 1
        );
        
        newBricks.push({
          id: id++,
          x: 10 + col * BRICK_WIDTH,
          y: startY + row * (BRICK_HEIGHT + BRICK_PADDING),
          tier: tierIndex,
          hits: POWER_TIERS[tierIndex].hits,
          active: true,
        });
      }
    }
    return newBricks;
  }, []);

  // Initialize ball
  const initBall = useCallback(() => {
    return {
      id: Date.now(),
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT - PADDLE_HEIGHT - 40 - BALL_SIZE,
      vx: (Math.random() > 0.5 ? 1 : -1) * 3,
      vy: -ballSpeedRef.current,
      active: true,
    };
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setBricks(initBricks(1));
    setBalls([initBall()]);
    setPowerUps([]);
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    setPaddleWidth(PADDLE_WIDTH);
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnergyStored(0);
    setPowerLevel(0);
    setCombo(0);
    ballSpeedRef.current = 5;
    setGameState('playing');
    playGameStart();
  }, [initBricks, initBall]);

  // Next level
  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setBricks(initBricks(newLevel));
    setBalls([initBall()]);
    setPowerUps([]);
    setPaddleWidth(PADDLE_WIDTH);
    ballSpeedRef.current = Math.min(5 + newLevel * 0.5, 10);
    setScore(s => s + 500); // Level completion bonus
    setEnergyStored(s => s + 100); // Energy reward
    if (Platform.OS !== 'web') Vibration.vibrate(100);
  }, [level, initBricks, initBall]);

  // Move paddle
  const movePaddle = useCallback((direction: 'left' | 'right') => {
    setPaddleX(prev => {
      const step = 20;
      if (direction === 'left') {
        return Math.max(0, prev - step);
      } else {
        return Math.min(GAME_WIDTH - paddleWidth, prev + step);
      }
    });
  }, [paddleWidth]);

  // Pan responder for touch/mouse control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = gestureState.moveX - 16 - paddleWidth / 2;
        setPaddleX(Math.max(0, Math.min(GAME_WIDTH - paddleWidth, newX)));
      },
    })
  ).current;

  // Spawn power-up
  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > 0.85) { // 15% chance
      const types = Object.keys(POWER_UPS) as PowerUpType[];
      const type = types[Math.floor(Math.random() * types.length)];
      setPowerUps(prev => [...prev, {
        id: Date.now(),
        x,
        y,
        type,
        active: true,
      }]);
    }
  }, []);

  // Apply power-up
  const applyPowerUp = useCallback((type: PowerUpType) => {
    switch (type) {
      case 'WIDE_PADDLE':
        setPaddleWidth(PADDLE_WIDTH * 1.5);
        setTimeout(() => setPaddleWidth(PADDLE_WIDTH), 10000);
        break;
      case 'MULTI_BALL':
        setBalls(prev => {
          if (prev.length < 3) {
            const activeBall = prev.find(b => b.active);
            if (activeBall) {
              return [...prev, 
                { ...activeBall, id: Date.now(), vx: -activeBall.vx },
                { ...activeBall, id: Date.now() + 1, vx: activeBall.vx * 0.5, vy: -activeBall.vy }
              ];
            }
          }
          return prev;
        });
        break;
      case 'ENERGY_BOOST':
        setEnergyStored(s => s + 50);
        setPowerLevel(a => Math.min(a + 1, 5));
        break;
      case 'SLOW_BALL':
        ballSpeedRef.current = Math.max(3, ballSpeedRef.current - 1);
        break;
    }
    if (Platform.OS !== 'web') Vibration.vibrate(50);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Update balls
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.active) return ball;

          let newX = ball.x + ball.vx;
          let newY = ball.y + ball.vy;
          let newVX = ball.vx;
          let newVY = ball.vy;

          // Wall collisions
          if (newX <= 0 || newX >= GAME_WIDTH - BALL_SIZE) {
            newVX = -newVX;
            newX = newX <= 0 ? 0 : GAME_WIDTH - BALL_SIZE;
          }
          if (newY <= 0) {
            newVY = -newVY;
            newY = 0;
          }

          // Paddle collision
          if (newY + BALL_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - 10 &&
              newY <= GAME_HEIGHT - 10 &&
              newX + BALL_SIZE >= paddleX &&
              newX <= paddleX + paddleWidth) {
            newVY = -Math.abs(newVY);
            // Add angle based on where ball hits paddle
            const hitPos = (newX + BALL_SIZE / 2 - paddleX) / paddleWidth;
            newVX = (hitPos - 0.5) * 8;
            newY = GAME_HEIGHT - PADDLE_HEIGHT - 10 - BALL_SIZE;
            if (Platform.OS !== 'web') Vibration.vibrate(10);
          }

          // Ball lost
          if (newY > GAME_HEIGHT) {
            return { ...ball, active: false };
          }

          return { ...ball, x: newX, y: newY, vx: newVX, vy: newVY };
        });
      });

      // Check brick collisions
      setBricks(prevBricks => {
        let updatedBricks = [...prevBricks];
        let scoreGained = 0;
        let bricksHit = false;

        setBalls(prevBalls => {
          return prevBalls.map(ball => {
            if (!ball.active) return ball;

            let newVY = ball.vy;
            let newVX = ball.vx;

            for (let i = 0; i < updatedBricks.length; i++) {
              const brick = updatedBricks[i];
              if (!brick.active) continue;

              // Check collision
              if (ball.x + BALL_SIZE > brick.x &&
                  ball.x < brick.x + BRICK_WIDTH - BRICK_PADDING * 2 &&
                  ball.y + BALL_SIZE > brick.y &&
                  ball.y < brick.y + BRICK_HEIGHT) {
                
                // Hit brick
                updatedBricks[i] = {
                  ...brick,
                  hits: brick.hits - 1,
                  active: brick.hits > 1,
                };

                if (brick.hits <= 1) {
                  // Brick destroyed
                  const tier = POWER_TIERS[brick.tier];
                  scoreGained += tier.points * (1 + combo * 0.1);
                  setCombo(c => c + 1);
                  setEnergyStored(s => s + tier.points / 2);
                  setPowerLevel(parseInt(tier.boost.replace('⚡', '')));
                  spawnPowerUp(brick.x + BRICK_WIDTH / 2, brick.y);
                }

                // Bounce
                newVY = -newVY;
                bricksHit = true;
                break;
              }
            }

            return { ...ball, vy: newVY, vx: newVX };
          });
        });

        if (scoreGained > 0) {
          setScore(s => s + Math.floor(scoreGained));
        }

        if (!bricksHit) {
          setCombo(0);
        }

        return updatedBricks;
      });

      // Update power-ups
      setPowerUps(prev => {
        return prev.map(pu => {
          if (!pu.active) return pu;
          
          const newY = pu.y + 3;
          
          // Check paddle collision
          if (newY + 20 >= GAME_HEIGHT - PADDLE_HEIGHT - 10 &&
              newY <= GAME_HEIGHT - 10 &&
              pu.x + 20 >= paddleX &&
              pu.x <= paddleX + paddleWidth) {
            applyPowerUp(pu.type);
            return { ...pu, active: false };
          }
          
          // Power-up lost
          if (newY > GAME_HEIGHT) {
            return { ...pu, active: false };
          }
          
          return { ...pu, y: newY };
        }).filter(pu => pu.active || pu.y <= GAME_HEIGHT);
      });

      // Check if all balls lost
      setBalls(prevBalls => {
        const activeBalls = prevBalls.filter(b => b.active);
        if (activeBalls.length === 0 && prevBalls.length > 0) {
          setLives(l => {
            if (l <= 1) {
              playGameOver();
          setGameState('gameover');
              submitScore('stake-smash', score);
              return 0;
            }
            // Respawn ball
            setTimeout(() => {
              setBalls([initBall()]);
            }, 500);
            return l - 1;
          });
          setCombo(0);
          if (Platform.OS !== 'web') Vibration.vibrate(200);
        }
        return prevBalls;
      });

      // Check victory
      setBricks(prevBricks => {
        if (prevBricks.every(b => !b.active)) {
          if (level >= 5) {
            setGameState('victory');
            submitScore('stake-smash', score + 1000);
          } else {
            nextLevel();
          }
        }
        return prevBricks;
      });

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, paddleX, paddleWidth, level, score, combo, initBall, nextLevel, spawnPowerUp, applyPowerUp, submitScore]);

  // Render brick
  const renderBrick = (brick: Brick) => {
    if (!brick.active) return null;
    const tier = POWER_TIERS[brick.tier];
    const opacity = brick.hits / POWER_TIERS[brick.tier].hits;
    
    return (
      <View
        key={brick.id}
        style={[
          styles.brick,
          {
            left: brick.x,
            top: brick.y,
            width: BRICK_WIDTH - BRICK_PADDING * 2,
            height: BRICK_HEIGHT - BRICK_PADDING,
            backgroundColor: tier.color,
            opacity: 0.5 + opacity * 0.5,
          },
        ]}
      >
        <Text style={styles.brickText}>{tier.boost}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Scanlines opacity={0.05} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>POWER SMASH</Text>
            <Text style={styles.subtitle}>Break crystals, charge your power!</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <View style={styles.lives}>
              {[...Array(lives)].map((_, i) => (
                <Text key={i} style={styles.heart}>♥</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Energy Info */}
        <View style={styles.energyBar}>
          <View style={styles.energyInfo}>
            <Text style={styles.energyLabel}>ENERGY</Text>
            <Text style={styles.energyValue}>{energyStored}</Text>
          </View>
          <View style={styles.energyInfo}>
            <Text style={styles.energyLabel}>POWER</Text>
            <Text style={[styles.energyValue, { color: COLORS.success }]}>⚡{powerLevel}</Text>
          </View>
          <View style={styles.energyInfo}>
            <Text style={styles.energyLabel}>COMBO</Text>
            <Text style={[styles.energyValue, { color: COLORS.neonPink }]}>x{combo}</Text>
          </View>
          <View style={styles.energyInfo}>
            <Text style={styles.energyLabel}>LEVEL</Text>
            <Text style={styles.energyValue}>{level}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View 
          style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
          {...panResponder.panHandlers}
        >
          {/* Bricks */}
          {bricks.map(renderBrick)}

          {/* Power-ups */}
          {powerUps.filter(pu => pu.active).map(pu => (
            <View
              key={pu.id}
              style={[
                styles.powerUp,
                {
                  left: pu.x,
                  top: pu.y,
                  backgroundColor: POWER_UPS[pu.type].color,
                },
              ]}
            >
              <Text style={styles.powerUpIcon}>{POWER_UPS[pu.type].icon}</Text>
            </View>
          ))}

          {/* Balls */}
          {balls.filter(b => b.active).map(ball => (
            <View
              key={ball.id}
              style={[
                styles.ball,
                { left: ball.x, top: ball.y },
              ]}
            />
          ))}

          {/* Paddle */}
          <View
            style={[
              styles.paddle,
              {
                left: paddleX,
                width: paddleWidth,
                bottom: 10,
              },
            ]}
          />

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>POWER SMASH</Text>
              <Text style={styles.overlayIcon}>⚡</Text>
              <Text style={styles.overlayText}>Break power crystals to charge up!</Text>
              <Text style={styles.overlayHint}>Higher tier = More power</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Over - Using RektScreen */}
          <RektScreen
            visible={gameState === 'gameover'}
            score={score}
            reason={`Energy: ${energyStored} | Power: ⚡${powerLevel}`}
            onRetry={startGame}
            onQuit={() => router.push('/')}
          />

          {gameState === 'victory' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>🎉 MAX POWER!</Text>
              <Text style={styles.overlayScore}>Score: {score + 1000}</Text>
              <Text style={styles.overlayText}>You mastered power charging!</Text>
              <Text style={styles.lessonText}>
                Patience pays off! Charging up over time gives bigger rewards!
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>POWER LESSON:</Text>
          <Text style={styles.infoText}>
            Break higher-tier crystals for more power! Stack combos to charge up faster - patience gives bigger rewards!
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePaddle('left')}
            activeOpacity={0.7}
          >
            <Text style={styles.controlText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.controlSpacer}>
            <Text style={styles.controlHint}>or drag paddle</Text>
          </View>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePaddle('right')}
            activeOpacity={0.7}
          >
            <Text style={styles.controlText}>▶</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lives: {
    flexDirection: 'row',
  },
  heart: {
    fontSize: 12,
    color: COLORS.neonPink,
    marginLeft: 2,
  },
  energyBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.bgMedium,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '40',
  },
  energyInfo: {
    alignItems: 'center',
  },
  energyLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  energyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gameArea: {
    alignSelf: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonCyan,
    position: 'relative',
    overflow: 'hidden',
  },
  brick: {
    position: 'absolute',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brickText: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    backgroundColor: '#FFF',
    borderRadius: BALL_SIZE / 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  paddle: {
    position: 'absolute',
    height: PADDLE_HEIGHT,
    backgroundColor: COLORS.neonCyan,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  powerUp: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpIcon: {
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  overlayIcon: {
    fontSize: 50,
    marginVertical: 12,
  },
  overlayScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 4,
  },
  overlayHint: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  lessonText: {
    fontSize: 11,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  startBtn: {
    backgroundColor: COLORS.neonCyan,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backToArcade: {
    marginTop: 12,
    padding: 8,
  },
  backToArcadeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoBox: {
    backgroundColor: COLORS.bgMedium,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '40',
  },
  infoTitle: {
    fontSize: 10,
    color: COLORS.neonCyan,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  controlBtn: {
    width: 70,
    height: 50,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 24,
    color: COLORS.neonCyan,
    fontWeight: 'bold',
  },
  controlSpacer: {
    width: 100,
    alignItems: 'center',
  },
  controlHint: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
