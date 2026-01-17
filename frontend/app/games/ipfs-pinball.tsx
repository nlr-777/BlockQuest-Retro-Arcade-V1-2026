// BlockQuest Official - IPFS Pinball
// Pinball game teaching decentralized storage concepts
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../src/constants/colors';
import { PixelText } from '../../src/components/PixelText';
import { PixelButton } from '../../src/components/PixelButton';
import { useGameStore } from '../../src/store/gameStore';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { RektScreen } from '../../src/components/RektScreen';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { RoastHUD } from '../../src/components/RoastHUD';
import { GAMES } from '../../src/constants/games';

const GAME_CONFIG = GAMES.find(g => g.id === 'ipfs-pinball')!;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 32, 350);
const GAME_HEIGHT = GAME_WIDTH * 1.4;

// Game constants
const BALL_SIZE = 14;
const FLIPPER_WIDTH = 60;
const FLIPPER_HEIGHT = 12;
const BUMPER_SIZE = 30;
const PIN_SIZE = 20;

// Bumper types representing IPFS concepts
const BUMPER_TYPES = [
  { id: 'hash', label: 'HASH', color: '#FF6B6B', points: 100 },
  { id: 'pin', label: 'PIN', color: '#4ECDC4', points: 150 },
  { id: 'node', label: 'NODE', color: '#45B7D1', points: 200 },
  { id: 'store', label: 'CID', color: '#96CEB4', points: 250 },
];

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Bumper {
  id: string;
  x: number;
  y: number;
  type: typeof BUMPER_TYPES[0];
  hits: number;
}

interface Pin {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

type GameState = 'ready' | 'playing' | 'gameover' | 'rewards';

export default function IPFSPinballGame() {
  const router = useRouter();
  const { submitScore, addXP } = useGameStore();
  const { playCollect, playHit, playGameStart, playGameOver, playPowerup } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(3);
  const [multiplier, setMultiplier] = useState(1);
  const [filesStored, setFilesStored] = useState(0);
  
  // Ball state
  const [ball, setBall] = useState<Ball>({ x: GAME_WIDTH / 2, y: 100, vx: 2, vy: 3 });
  const [ballActive, setBallActive] = useState(false);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);
  
  // Flipper state
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const leftFlipperAngle = useSharedValue(0);
  const rightFlipperAngle = useSharedValue(0);
  
  // Bumpers and pins
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize game
  const initGame = useCallback(() => {
    // Create bumpers
    const newBumpers: Bumper[] = [
      { id: '1', x: GAME_WIDTH * 0.25, y: GAME_HEIGHT * 0.25, type: BUMPER_TYPES[0], hits: 0 },
      { id: '2', x: GAME_WIDTH * 0.75, y: GAME_HEIGHT * 0.25, type: BUMPER_TYPES[1], hits: 0 },
      { id: '3', x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.35, type: BUMPER_TYPES[2], hits: 0 },
      { id: '4', x: GAME_WIDTH * 0.3, y: GAME_HEIGHT * 0.45, type: BUMPER_TYPES[3], hits: 0 },
      { id: '5', x: GAME_WIDTH * 0.7, y: GAME_HEIGHT * 0.45, type: BUMPER_TYPES[0], hits: 0 },
    ];
    
    // Create pins (small obstacles)
    const newPins: Pin[] = [];
    for (let i = 0; i < 8; i++) {
      newPins.push({
        id: `pin-${i}`,
        x: GAME_WIDTH * 0.2 + (i % 4) * (GAME_WIDTH * 0.2),
        y: GAME_HEIGHT * 0.55 + Math.floor(i / 4) * 40,
        active: true,
      });
    }
    
    setBumpers(newBumpers);
    setPins(newPins);
    setScore(0);
    setBalls(3);
    setMultiplier(1);
    setFilesStored(0);
    setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, vx: 0, vy: 0 });
    setBallActive(false);
  }, []);

  // Launch ball
  const launchBall = useCallback(() => {
    if (ballActive || balls <= 0) return;
    
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 100,
      vx: (Math.random() - 0.5) * 4,
      vy: -8,
    });
    setBallActive(true);
    playGameStart();
  }, [ballActive, balls, playGameStart]);

  // Start game
  const startGame = useCallback(() => {
    initGame();
    setHighScoreBeaten(false);
    setGameState('playing');
  }, [initGame]);

  // Handle rewards -> gameover transition
  const handleRewardsContinue = useCallback(() => {
    setGameState('gameover');
    setHighScoreBeaten(false);
  }, []);

  // Flipper controls
  useEffect(() => {
    leftFlipperAngle.value = withSpring(leftFlipperUp ? -45 : 0, { damping: 15 });
  }, [leftFlipperUp]);

  useEffect(() => {
    rightFlipperAngle.value = withSpring(rightFlipperUp ? 45 : 0, { damping: 15 });
  }, [rightFlipperUp]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !ballActive) return;

    gameLoopRef.current = setInterval(() => {
      setBall(prev => {
        let { x, y, vx, vy } = prev;
        
        // Apply gravity
        vy += 0.15;
        
        // Apply velocity
        x += vx;
        y += vy;
        
        // Wall bounces
        if (x < BALL_SIZE / 2) {
          x = BALL_SIZE / 2;
          vx = Math.abs(vx) * 0.9;
        }
        if (x > GAME_WIDTH - BALL_SIZE / 2) {
          x = GAME_WIDTH - BALL_SIZE / 2;
          vx = -Math.abs(vx) * 0.9;
        }
        if (y < BALL_SIZE / 2) {
          y = BALL_SIZE / 2;
          vy = Math.abs(vy) * 0.9;
        }
        
        // Bumper collisions
        bumpers.forEach(bumper => {
          const dx = x - bumper.x;
          const dy = y - bumper.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < (BALL_SIZE + BUMPER_SIZE) / 2) {
            // Bounce off bumper
            const angle = Math.atan2(dy, dx);
            vx = Math.cos(angle) * 6;
            vy = Math.sin(angle) * 6;
            
            // Score and effects
            setScore(s => s + bumper.type.points * multiplier);
            setFilesStored(f => f + 1);
            playCollect();
            if (Platform.OS !== 'web') Vibration.vibrate(30);
            
            // Update bumper hits
            setBumpers(prev => prev.map(b => 
              b.id === bumper.id ? { ...b, hits: b.hits + 1 } : b
            ));
          }
        });
        
        // Pin collisions
        pins.forEach(pin => {
          if (!pin.active) return;
          
          const dx = x - pin.x;
          const dy = y - pin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < (BALL_SIZE + PIN_SIZE) / 2) {
            const angle = Math.atan2(dy, dx);
            vx = Math.cos(angle) * 4;
            vy = Math.sin(angle) * 4;
            setScore(s => s + 25 * multiplier);
            playHit();
          }
        });
        
        // Left flipper collision
        if (leftFlipperUp) {
          const flipperX = GAME_WIDTH * 0.25;
          const flipperY = GAME_HEIGHT - 60;
          if (y > flipperY - 20 && y < flipperY + 20 &&
              x > flipperX - FLIPPER_WIDTH/2 && x < flipperX + FLIPPER_WIDTH/2) {
            vy = -10;
            vx = -3 + (x - flipperX) * 0.1;
            playPowerup();
          }
        }
        
        // Right flipper collision
        if (rightFlipperUp) {
          const flipperX = GAME_WIDTH * 0.75;
          const flipperY = GAME_HEIGHT - 60;
          if (y > flipperY - 20 && y < flipperY + 20 &&
              x > flipperX - FLIPPER_WIDTH/2 && x < flipperX + FLIPPER_WIDTH/2) {
            vy = -10;
            vx = 3 + (x - flipperX) * 0.1;
            playPowerup();
          }
        }
        
        // Ball lost
        if (y > GAME_HEIGHT + BALL_SIZE) {
          setBallActive(false);
          setBalls(b => {
            const newBalls = b - 1;
            if (newBalls <= 0) {
              playGameOver();
              setGameState('gameover');
              submitScore('ipfs-pinball', score);
              addXP(Math.floor(score / 10));
            }
            return newBalls;
          });
          return { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, vx: 0, vy: 0 };
        }
        
        // Speed limit
        vx = Math.max(-12, Math.min(12, vx));
        vy = Math.max(-12, Math.min(12, vy));
        
        return { x, y, vx, vy };
      });
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, ballActive, bumpers, pins, leftFlipperUp, rightFlipperUp, multiplier, score]);

  const leftFlipperStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leftFlipperAngle.value}deg` }],
  }));

  const rightFlipperStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rightFlipperAngle.value}deg` }],
  }));

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
          <View style={styles.ballsContainer}>
            <PixelText size="xs" color={COLORS.textMuted}>BALLS</PixelText>
            <PixelText size="lg" color={COLORS.neonCyan}>{'⚪'.repeat(balls)}</PixelText>
          </View>
        </View>

        {/* Stats Bar */}
        {gameState === 'playing' && (
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>FILES STORED</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>{filesStored}</PixelText>
            </View>
            <View style={styles.stat}>
              <PixelText size="xs" color={COLORS.textMuted}>MULTIPLIER</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>{multiplier}x</PixelText>
            </View>
          </View>
        )}

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Bumpers */}
          {bumpers.map(bumper => (
            <View
              key={bumper.id}
              style={[
                styles.bumper,
                {
                  left: bumper.x - BUMPER_SIZE / 2,
                  top: bumper.y - BUMPER_SIZE / 2,
                  backgroundColor: bumper.type.color,
                },
              ]}
            >
              <Text style={styles.bumperText}>{bumper.type.label}</Text>
            </View>
          ))}

          {/* Pins */}
          {pins.map(pin => pin.active && (
            <View
              key={pin.id}
              style={[
                styles.pin,
                { left: pin.x - PIN_SIZE / 2, top: pin.y - PIN_SIZE / 2 },
              ]}
            />
          ))}

          {/* Ball */}
          {ballActive && (
            <View
              style={[
                styles.ball,
                { left: ball.x - BALL_SIZE / 2, top: ball.y - BALL_SIZE / 2 },
              ]}
            />
          )}

          {/* Left Flipper */}
          <Animated.View
            style={[
              styles.flipper,
              styles.leftFlipper,
              { left: GAME_WIDTH * 0.25 - FLIPPER_WIDTH / 2, bottom: 50 },
              leftFlipperStyle,
            ]}
          />

          {/* Right Flipper */}
          <Animated.View
            style={[
              styles.flipper,
              styles.rightFlipper,
              { left: GAME_WIDTH * 0.75 - FLIPPER_WIDTH / 2, bottom: 50 },
              rightFlipperStyle,
            ]}
          />

          {/* Launch area */}
          {!ballActive && gameState === 'playing' && balls > 0 && (
            <TouchableOpacity style={styles.launchArea} onPress={launchBall}>
              <PixelText size="xs" color={COLORS.neonCyan}>TAP TO LAUNCH</PixelText>
            </TouchableOpacity>
          )}
        </View>

        {/* Flipper Controls */}
        {gameState === 'playing' && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.flipperButton, leftFlipperUp && styles.flipperButtonActive]}
              onPressIn={() => setLeftFlipperUp(true)}
              onPressOut={() => setLeftFlipperUp(false)}
            >
              <PixelText size="md" color={COLORS.neonPink}>◀ LEFT</PixelText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flipperButton, rightFlipperUp && styles.flipperButtonActive]}
              onPressIn={() => setRightFlipperUp(true)}
              onPressOut={() => setRightFlipperUp(false)}
            >
              <PixelText size="md" color={COLORS.neonCyan}>RIGHT ▶</PixelText>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <PixelText size="xs" color={COLORS.neonCyan}>🔗 IPFS LESSON:</PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            Each bumper = a storage node. Hit them to "pin" your files across the network!
          </PixelText>
        </View>

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <View style={styles.overlay}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
              <PixelText size="xxl" color={COLORS.neonPink} glow>IPFS PINBALL</PixelText>
              <Text style={styles.menuIcon}>🎯📁</Text>
              
              <View style={styles.instructionBox}>
                <PixelText size="xs" color={COLORS.chainGold}>HOW TO PLAY:</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Hold LEFT/RIGHT to flip</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Hit bumpers to store files</PixelText>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Each node stores your data!</PixelText>
              </View>
              
              <PixelButton
                title="START PINBALL"
                onPress={startGame}
                color={COLORS.neonPink}
                size="lg"
                style={{ marginTop: 24 }}
              />
            </Animated.View>
          </View>
        )}

        {/* Game Over - Using RektScreen */}
        <RektScreen
          visible={gameState === 'gameover'}
          score={score}
          reason={`Files Stored: ${filesStored}`}
          onRetry={startGame}
          onQuit={() => router.back()}
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
  ballsContainer: { alignItems: 'center' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: COLORS.cardBg, marginHorizontal: 16, borderRadius: 8 },
  stat: { alignItems: 'center' },
  gameArea: { alignSelf: 'center', backgroundColor: '#1a1a2e', borderWidth: 3, borderColor: COLORS.neonPink, borderRadius: 8, marginTop: 16, overflow: 'hidden', position: 'relative' },
  bumper: { position: 'absolute', width: BUMPER_SIZE, height: BUMPER_SIZE, borderRadius: BUMPER_SIZE / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  bumperText: { fontSize: 8, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  pin: { position: 'absolute', width: PIN_SIZE, height: PIN_SIZE, borderRadius: PIN_SIZE / 2, backgroundColor: COLORS.chainGold },
  ball: { position: 'absolute', width: BALL_SIZE, height: BALL_SIZE, borderRadius: BALL_SIZE / 2, backgroundColor: '#fff', shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  flipper: { position: 'absolute', width: FLIPPER_WIDTH, height: FLIPPER_HEIGHT, backgroundColor: COLORS.neonCyan, borderRadius: 6 },
  leftFlipper: { transformOrigin: 'right center' },
  rightFlipper: { transformOrigin: 'left center' },
  launchArea: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', padding: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  flipperButton: { flex: 1, height: 80, backgroundColor: COLORS.cardBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8, borderWidth: 2, borderColor: COLORS.cardBorder },
  flipperButtonActive: { backgroundColor: COLORS.neonPink + '40', borderColor: COLORS.neonPink },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 24, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.neonPink, maxWidth: 320 },
  menuIcon: { fontSize: 48, marginVertical: 16 },
  instructionBox: { backgroundColor: COLORS.bgDark, padding: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
