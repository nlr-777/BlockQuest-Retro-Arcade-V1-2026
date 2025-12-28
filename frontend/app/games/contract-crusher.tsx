// BlockQuest Official - Contract Crusher
// Arkanoid/Breakout style game teaching Smart Contracts
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
import { GAMES } from '../../src/constants/games';

const GAME_CONFIG = GAMES.find(g => g.id === 'contract-crusher')!;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 32, 350);
const GAME_HEIGHT = GAME_WIDTH * 1.3;

// Game constants
const PADDLE_WIDTH = 70;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 12;
const BRICK_ROWS = 6;
const BRICK_COLS = 7;
const BRICK_WIDTH = (GAME_WIDTH - 20) / BRICK_COLS;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 2;

// Contract types (brick types)
const CONTRACT_TYPES = [
  { id: 'if', label: 'IF', color: '#FF6B6B', points: 10, condition: 'Check condition' },
  { id: 'then', label: 'THEN', color: '#4ECDC4', points: 15, condition: 'Execute action' },
  { id: 'else', label: 'ELSE', color: '#45B7D1', points: 15, condition: 'Alternative path' },
  { id: 'pay', label: 'PAY', color: '#96CEB4', points: 20, condition: 'Transfer value' },
  { id: 'mint', label: 'MINT', color: '#DDA0DD', points: 25, condition: 'Create token' },
  { id: 'burn', label: 'BURN', color: '#F4A460', points: 30, condition: 'Destroy token' },
];

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Brick {
  id: string;
  x: number;
  y: number;
  type: typeof CONTRACT_TYPES[0];
  health: number;
  maxHealth: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'wide' | 'multi' | 'slow' | 'laser';
  vy: number;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function ContractCrusherGame() {
  const router = useRouter();
  const { submitScore, addXP } = useGameStore();
  const { playCollect, playHit, playGameStart, playGameOver, playPowerup, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [contractsExecuted, setContractsExecuted] = useState(0);
  const [combo, setCombo] = useState(0);
  
  // Game objects
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, vx: 3, vy: -4 });
  const [ballActive, setBallActive] = useState(false);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH);
  
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number>(0);

  // Generate bricks for a level
  const generateBricks = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    const rows = Math.min(BRICK_ROWS, 3 + lvl);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const typeIndex = (row + col + lvl) % CONTRACT_TYPES.length;
        const health = row < 2 ? 1 : Math.min(3, Math.ceil(lvl / 2));
        
        newBricks.push({
          id: `${row}-${col}`,
          x: 10 + col * (BRICK_WIDTH + BRICK_GAP),
          y: 60 + row * (BRICK_HEIGHT + BRICK_GAP),
          type: CONTRACT_TYPES[typeIndex],
          health,
          maxHealth: health,
        });
      }
    }
    
    return newBricks;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setBricks(generateBricks(1));
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, vx: 0, vy: 0 });
    setBallActive(false);
    setScore(0);
    setLives(3);
    setLevel(1);
    setContractsExecuted(0);
    setCombo(0);
    setPowerUps([]);
    setPaddleWidth(PADDLE_WIDTH);
  }, [generateBricks]);

  // Launch ball
  const launchBall = useCallback(() => {
    if (ballActive) return;
    
    const angle = (Math.random() * 0.5 + 0.25) * Math.PI; // 45-135 degrees upward
    setBall({
      x: paddleX + paddleWidth / 2,
      y: GAME_HEIGHT - 80,
      vx: Math.cos(angle) * 5,
      vy: -Math.abs(Math.sin(angle) * 5),
    });
    setBallActive(true);
    playGameStart();
  }, [ballActive, paddleX, paddleWidth, playGameStart]);

  // Start game
  const startGame = useCallback(() => {
    initGame();
    setGameState('playing');
  }, [initGame]);

  // Move paddle
  const movePaddle = useCallback((touchX: number) => {
    const gameAreaLeft = (SCREEN_WIDTH - GAME_WIDTH) / 2;
    const relativeX = touchX - gameAreaLeft;
    const newX = Math.max(0, Math.min(GAME_WIDTH - paddleWidth, relativeX - paddleWidth / 2));
    setPaddleX(newX);
    
    // Move ball with paddle if not launched
    if (!ballActive) {
      setBall(prev => ({ ...prev, x: newX + paddleWidth / 2 }));
    }
  }, [paddleWidth, ballActive]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !ballActive) return;

    gameLoopRef.current = setInterval(() => {
      // Update ball
      setBall(prev => {
        let { x, y, vx, vy } = prev;
        
        x += vx;
        y += vy;
        
        // Wall bounces
        if (x < BALL_SIZE / 2) {
          x = BALL_SIZE / 2;
          vx = Math.abs(vx);
        }
        if (x > GAME_WIDTH - BALL_SIZE / 2) {
          x = GAME_WIDTH - BALL_SIZE / 2;
          vx = -Math.abs(vx);
        }
        if (y < BALL_SIZE / 2) {
          y = BALL_SIZE / 2;
          vy = Math.abs(vy);
        }
        
        // Paddle collision
        if (y > GAME_HEIGHT - 50 && y < GAME_HEIGHT - 30 &&
            x > paddleX - 5 && x < paddleX + paddleWidth + 5) {
          // Bounce angle based on where ball hits paddle
          const hitPos = (x - paddleX) / paddleWidth;
          const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63 to 63 degrees
          const speed = Math.sqrt(vx * vx + vy * vy);
          vx = Math.sin(angle) * speed;
          vy = -Math.abs(Math.cos(angle) * speed);
          y = GAME_HEIGHT - 52;
          playHit();
        }
        
        // Brick collision
        let brickHit = false;
        setBricks(prevBricks => {
          const newBricks = [...prevBricks];
          
          for (let i = 0; i < newBricks.length; i++) {
            const brick = newBricks[i];
            
            if (x > brick.x - BALL_SIZE / 2 && x < brick.x + BRICK_WIDTH + BALL_SIZE / 2 &&
                y > brick.y - BALL_SIZE / 2 && y < brick.y + BRICK_HEIGHT + BALL_SIZE / 2) {
              
              brickHit = true;
              brick.health--;
              
              if (brick.health <= 0) {
                // Brick destroyed
                setScore(s => s + brick.type.points * (1 + Math.floor(combo / 5)));
                setContractsExecuted(c => c + 1);
                setCombo(c => c + 1);
                playCollect();
                
                // Maybe drop power-up
                if (Math.random() < 0.15) {
                  const powerTypes: ('wide' | 'multi' | 'slow' | 'laser')[] = ['wide', 'multi', 'slow', 'laser'];
                  setPowerUps(prev => [...prev, {
                    id: `pu-${Date.now()}`,
                    x: brick.x + BRICK_WIDTH / 2,
                    y: brick.y,
                    type: powerTypes[Math.floor(Math.random() * powerTypes.length)],
                    vy: 2,
                  }]);
                }
                
                newBricks.splice(i, 1);
              } else {
                playHit();
              }
              
              // Determine bounce direction
              const brickCenterX = brick.x + BRICK_WIDTH / 2;
              const brickCenterY = brick.y + BRICK_HEIGHT / 2;
              
              if (Math.abs(x - brickCenterX) > Math.abs(y - brickCenterY) * (BRICK_WIDTH / BRICK_HEIGHT)) {
                vx = -vx;
              } else {
                vy = -vy;
              }
              
              if (Platform.OS !== 'web') Vibration.vibrate(20);
              break;
            }
          }
          
          return newBricks;
        });
        
        if (!brickHit) {
          // Reset combo if no brick hit for a while
        }
        
        // Ball lost
        if (y > GAME_HEIGHT + BALL_SIZE) {
          setBallActive(false);
          setCombo(0);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              playGameOver();
              setGameState('gameover');
              submitScore('contract-crusher', score);
              addXP(Math.floor(score / 5));
            }
            return newLives;
          });
          return { x: paddleX + paddleWidth / 2, y: GAME_HEIGHT - 80, vx: 0, vy: 0 };
        }
        
        return { x, y, vx, vy };
      });

      // Update power-ups
      setPowerUps(prev => {
        const newPowerUps: PowerUp[] = [];
        
        prev.forEach(pu => {
          pu.y += pu.vy;
          
          // Check paddle collection
          if (pu.y > GAME_HEIGHT - 50 && pu.y < GAME_HEIGHT - 20 &&
              pu.x > paddleX && pu.x < paddleX + paddleWidth) {
            playPowerup();
            
            switch (pu.type) {
              case 'wide':
                setPaddleWidth(w => Math.min(w + 20, 120));
                break;
              case 'slow':
                setBall(b => ({ ...b, vx: b.vx * 0.7, vy: b.vy * 0.7 }));
                break;
              case 'multi':
                setScore(s => s + 50);
                break;
              case 'laser':
                setScore(s => s + 100);
                break;
            }
          } else if (pu.y < GAME_HEIGHT + 20) {
            newPowerUps.push(pu);
          }
        });
        
        return newPowerUps;
      });

      // Check victory
      setBricks(prev => {
        if (prev.length === 0 && ballActive) {
          playLevelUp();
          setLevel(l => {
            const newLevel = l + 1;
            if (newLevel > 5) {
              setGameState('victory');
              submitScore('contract-crusher', score);
              addXP(Math.floor(score / 3));
            } else {
              setBricks(generateBricks(newLevel));
              setBallActive(false);
              setBall({ x: paddleX + paddleWidth / 2, y: GAME_HEIGHT - 80, vx: 0, vy: 0 });
            }
            return newLevel;
          });
        }
        return prev;
      });
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, ballActive, paddleX, paddleWidth, combo, score, generateBricks]);

  const getPowerUpColor = (type: string) => {
    switch (type) {
      case 'wide': return '#FF6B6B';
      case 'multi': return '#4ECDC4';
      case 'slow': return '#45B7D1';
      case 'laser': return '#DDA0DD';
      default: return '#fff';
    }
  };

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'wide': return '↔️';
      case 'multi': return '✖️';
      case 'slow': return '🐢';
      case 'laser': return '⚡';
      default: return '?';
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.scoreContainer}>
            <PixelText size="xs" color={COLORS.textMuted}>SCORE</PixelText>
            <PixelText size="lg" color={COLORS.neonPink} glow>{score}</PixelText>
          </View>
          <View style={styles.livesContainer}>
            <PixelText size="xs" color={COLORS.textMuted}>LIVES</PixelText>
            <PixelText size="lg" color={COLORS.error}>{'❤️'.repeat(lives)}</PixelText>
          </View>
        </View>

        {/* Stats Bar */}
        {gameState === 'playing' && (
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>CONTRACTS</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>{contractsExecuted}</PixelText>
            </View>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>LEVEL</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>{level}</PixelText>
            </View>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>COMBO</PixelText>
              <PixelText size="sm" color={combo > 5 ? COLORS.neonPink : COLORS.textSecondary}>{combo}x</PixelText>
            </View>
          </View>
        )}

        {/* Game Area */}
        <View 
          style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
          onTouchStart={(e) => {
            touchStartRef.current = e.nativeEvent.pageX;
            if (!ballActive && gameState === 'playing') launchBall();
          }}
          onTouchMove={(e) => movePaddle(e.nativeEvent.pageX)}
          {...(Platform.OS === 'web' ? {
            onMouseDown: (e: any) => {
              touchStartRef.current = e.nativeEvent.pageX;
              if (!ballActive && gameState === 'playing') launchBall();
            },
            onMouseMove: (e: any) => {
              if (e.buttons === 1) { // Left mouse button pressed
                movePaddle(e.nativeEvent.pageX);
              }
            },
          } : {})}
        >
          {/* Bricks */}
          {bricks.map(brick => (
            <View
              key={brick.id}
              style={[
                styles.brick,
                {
                  left: brick.x,
                  top: brick.y,
                  width: BRICK_WIDTH - BRICK_GAP,
                  height: BRICK_HEIGHT - BRICK_GAP,
                  backgroundColor: brick.type.color,
                  opacity: 0.5 + (brick.health / brick.maxHealth) * 0.5,
                },
              ]}
            >
              <Text style={styles.brickText}>{brick.type.label}</Text>
            </View>
          ))}

          {/* Power-ups */}
          {powerUps.map(pu => (
            <View
              key={pu.id}
              style={[
                styles.powerUp,
                { left: pu.x - 12, top: pu.y, backgroundColor: getPowerUpColor(pu.type) },
              ]}
            >
              <Text style={styles.powerUpIcon}>{getPowerUpIcon(pu.type)}</Text>
            </View>
          ))}

          {/* Ball */}
          <View
            style={[
              styles.ball,
              { left: ball.x - BALL_SIZE / 2, top: ball.y - BALL_SIZE / 2 },
            ]}
          />

          {/* Paddle */}
          <View
            style={[
              styles.paddle,
              { left: paddleX, bottom: 40, width: paddleWidth },
            ]}
          />

          {/* Launch hint */}
          {!ballActive && gameState === 'playing' && lives > 0 && (
            <View style={styles.launchHint}>
              <PixelText size="xs" color={COLORS.neonCyan}>TAP TO LAUNCH</PixelText>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <PixelText size="xs" color={COLORS.neonCyan}>📜 SMART CONTRACT:</PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            IF ball hits brick → THEN execute code → PAY points!
          </PixelText>
        </View>

        {/* Launch Button for Web */}
        {gameState === 'playing' && !ballActive && lives > 0 && (
          <TouchableOpacity 
            style={styles.launchButton}
            onPress={launchBall}
          >
            <PixelText size="lg" color={COLORS.chainGold}>🚀 TAP TO LAUNCH</PixelText>
          </TouchableOpacity>
        )}

        {/* Paddle Control Buttons */}
        {gameState === 'playing' && (
          <View style={styles.paddleControls}>
            <TouchableOpacity 
              style={styles.paddleControlBtn}
              onPressIn={() => setPaddleX(x => Math.max(0, x - 30))}
            >
              <PixelText size="xl" color={COLORS.neonCyan}>◀</PixelText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paddleControlBtn, styles.paddleControlBtnCenter]}
              onPress={launchBall}
            >
              <PixelText size="md" color={COLORS.chainGold}>{ballActive ? '🎮' : '🚀'}</PixelText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.paddleControlBtn}
              onPressIn={() => setPaddleX(x => Math.min(GAME_WIDTH - paddleWidth, x + 30))}
            >
              <PixelText size="xl" color={COLORS.neonCyan}>▶</PixelText>
            </TouchableOpacity>
          </View>
        )}

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <View style={styles.overlay}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
              <PixelText size="xxl" color={COLORS.chainGold} glow>CONTRACT CRUSHER</PixelText>
              <Text style={styles.menuIcon}>📜💥</Text>
              
              <View style={styles.instructionBox}>
                <PixelText size="xs" color={COLORS.chainGold}>HOW TO PLAY:</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Slide to move paddle</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Break blocks to execute contracts</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Catch power-ups for bonuses!</PixelText>
                <PixelText size="xs" color={COLORS.neonCyan}>💡 IF-THEN-ELSE = Smart Contract logic!</PixelText>
              </View>
              
              <PixelButton
                title="START CRUSHING"
                onPress={startGame}
                color={COLORS.chainGold}
                size="lg"
                style={{ marginTop: 24 }}
              />
            </Animated.View>
          </View>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <View style={styles.overlay}>
            <View style={styles.menuContent}>
              <PixelText size="xl" color={COLORS.error} glow>CONTRACT FAILED</PixelText>
              <PixelText size="lg" color={COLORS.chainGold}>Score: {score}</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>Contracts: {contractsExecuted}</PixelText>
              <View style={styles.gameOverButtons}>
                <PixelButton title="REDEPLOY" onPress={startGame} color={COLORS.chainGold} />
                <PixelButton title="EXIT" onPress={() => router.back()} color={COLORS.textMuted} />
              </View>
            </View>
          </View>
        )}

        {/* Victory */}
        {gameState === 'victory' && (
          <View style={styles.overlay}>
            <View style={styles.menuContent}>
              <PixelText size="xl" color={COLORS.success} glow>ALL CONTRACTS EXECUTED!</PixelText>
              <PixelText size="lg" color={COLORS.chainGold}>Score: {score}</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>Perfect Deployment! 🎉</PixelText>
              <View style={styles.gameOverButtons}>
                <PixelButton title="PLAY AGAIN" onPress={startGame} color={COLORS.success} />
                <PixelButton title="EXIT" onPress={() => router.back()} color={COLORS.textMuted} />
              </View>
            </View>
          </View>
        )}
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
  livesContainer: { alignItems: 'center' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: COLORS.cardBg, marginHorizontal: 16, borderRadius: 8 },
  stat: { alignItems: 'center' },
  gameArea: { alignSelf: 'center', backgroundColor: '#1a1a2e', borderWidth: 3, borderColor: COLORS.chainGold, borderRadius: 8, marginTop: 16, overflow: 'hidden', position: 'relative' },
  brick: { position: 'absolute', borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  brickText: { fontSize: 8, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  ball: { position: 'absolute', width: BALL_SIZE, height: BALL_SIZE, borderRadius: BALL_SIZE / 2, backgroundColor: '#fff', shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 },
  paddle: { position: 'absolute', height: PADDLE_HEIGHT, backgroundColor: COLORS.neonCyan, borderRadius: 6 },
  powerUp: { position: 'absolute', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  powerUpIcon: { fontSize: 12 },
  launchHint: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  launchButton: { backgroundColor: COLORS.chainGold + '30', padding: 16, borderRadius: 12, marginHorizontal: 16, marginTop: 12, alignItems: 'center', borderWidth: 2, borderColor: COLORS.chainGold },
  paddleControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12, paddingHorizontal: 16 },
  paddleControlBtn: { width: 70, height: 60, backgroundColor: COLORS.cardBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.neonCyan },
  paddleControlBtnCenter: { width: 60, height: 60, borderColor: COLORS.chainGold },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginTop: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 24, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.chainGold, maxWidth: 320 },
  menuIcon: { fontSize: 48, marginVertical: 16 },
  instructionBox: { backgroundColor: COLORS.bgDark, padding: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
