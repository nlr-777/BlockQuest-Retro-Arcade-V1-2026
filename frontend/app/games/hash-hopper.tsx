// Block Quest Official - Hash Hopper (Frogger Style Game)
// Teaches: Hash Functions - Tiny changes scramble everything
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
  withRepeat,
  withTiming,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Game constants
const GRID_COLS = 9;
const GRID_ROWS = 11;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 32) / GRID_COLS, 36);
const GAME_WIDTH = GRID_COLS * CELL_SIZE;
const GAME_HEIGHT = GRID_ROWS * CELL_SIZE;

type Position = { x: number; y: number };
type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

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
  const { profile, updateScore, mintBadge, addXP } = useGameStore();
  
  // Audio hook
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 4, y: 10 });
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [pathTaken, setPathTaken] = useState<string>('');
  const [currentHash, setCurrentHash] = useState('00000000');
  const [highestRow, setHighestRow] = useState(10);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
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

  // Start game
  const startGame = useCallback(() => {
    initGame();
    setGameState('playing');
    startTimeRef.current = Date.now();
    playGameStart();
  }, [initGame, playGameStart]);

  // Move player
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    playJump();
    setPlayerPos(prev => {
      const newX = Math.max(0, Math.min(GRID_COLS - 1, prev.x + dx));
      const newY = Math.max(0, Math.min(GRID_ROWS - 1, prev.y + dy));
      
      // Update path and hash
      const direction = dy < 0 ? 'U' : dy > 0 ? 'D' : dx < 0 ? 'L' : 'R';
      const newPath = pathTaken + direction;
      setPathTaken(newPath);
      setCurrentHash(generateHash(newPath));
      
      // Score for progress
      if (newY < highestRow) {
        setScore(s => s + (highestRow - newY) * 10);
        setHighestRow(newY);
      }
      
      // Check goal
      if (newY === 0) {
        setScore(s => s + 100);
        // Reset position but keep score
        setTimeout(() => {
          setPlayerPos({ x: 4, y: 10 });
          setHighestRow(10);
          setPathTaken('');
        }, 500);
      }
      
      if (Platform.OS !== 'web') Vibration.vibrate(10);
      
      return { x: newX, y: newY };
    });
  }, [gameState, pathTaken, highestRow]);

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
              setLives(l => {
                if (l <= 1) {
                  setGameState('gameover');
                  return 0;
                }
                setPlayerPos({ x: 4, y: 10 });
                setHighestRow(10);
                if (Platform.OS !== 'web') Vibration.vibrate(100);
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
            setLives(l => {
              if (l <= 1) {
                setGameState('gameover');
                return 0;
              }
              setPlayerPos({ x: 4, y: 10 });
              setHighestRow(10);
              if (Platform.OS !== 'web') Vibration.vibrate(100);
              return l - 1;
            });
          }
        }
      }
    }, 100);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, lanes, playerPos]);

  // Handle game over
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      updateScore('hash-hopper', score, duration);
      addXP(Math.floor(score / 10));

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

  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="crt-breathe" intensity={0.2} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.scoreContainer}>
          <PixelText size="xs" color={COLORS.textSecondary}>SCORE</PixelText>
          <PixelText size="lg" color={COLORS.hashGreen} glow>{score}</PixelText>
        </View>
        
        <View style={styles.livesContainer}>
          {Array(lives).fill(0).map((_, i) => (
            <PixelText key={i} size="md">💚</PixelText>
          ))}
        </View>
      </View>

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

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => movePlayer(0, -1)}>
            <Ionicons name="arrow-up" size={32} color={COLORS.hashGreen} />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => movePlayer(-1, 0)}>
            <Ionicons name="arrow-back" size={32} color={COLORS.hashGreen} />
          </TouchableOpacity>
          <View style={styles.controlSpacer} />
          <TouchableOpacity style={styles.controlButton} onPress={() => movePlayer(1, 0)}>
            <Ionicons name="arrow-forward" size={32} color={COLORS.hashGreen} />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => movePlayer(0, 1)}>
            <Ionicons name="arrow-down" size={32} color={COLORS.hashGreen} />
          </TouchableOpacity>
        </View>
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

      {/* Game Over */}
      {gameState === 'gameover' && (
        <View style={styles.overlay}>
          <Animated.View entering={FadeInDown} style={styles.menuContent}>
            <PixelText size="xl" color={COLORS.error} glow>HASH SCRAMBLED!</PixelText>
            <PixelText size="xxl" color={COLORS.chainGold} style={{ marginVertical: 16 }}>
              {score}
            </PixelText>
            <PixelText size="sm" color={COLORS.textSecondary}>Final Hash: 0x{currentHash}</PixelText>
            
            {score >= 200 && (
              <View style={styles.badgeEarned}>
                <PixelText size="sm" color={COLORS.success}>🏅 Badge Earned!</PixelText>
              </View>
            )}
            
            <View style={styles.gameOverButtons}>
              <PixelButton title="PLAY AGAIN" onPress={startGame} color={COLORS.hashGreen} size="md" />
              <PixelButton title="BACK TO ARCADE" onPress={() => router.push('/')} color={COLORS.cardBorder} textColor={COLORS.textPrimary} size="md" />
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scoreContainer: { alignItems: 'center' },
  livesContainer: { flexDirection: 'row' },
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
