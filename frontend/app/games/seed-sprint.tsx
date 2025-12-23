// Block Quest Official - Seed Sprint (Endless Runner Game)
// Teaches: Seed Phrases - Memorizing 12 words to recover wallet
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
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  runOnJS,
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
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = 300;
const PLAYER_SIZE = 40;
const GROUND_HEIGHT = 60;
const OBSTACLE_WIDTH = 30;
const WORD_COLLECT_SIZE = 50;

type GameState = 'menu' | 'playing' | 'checkpoint' | 'gameover';

// BIP-39 inspired seed words (kid-friendly)
const SEED_WORDS = [
  'apple', 'banana', 'cat', 'dog', 'eagle', 'fish',
  'grape', 'horse', 'igloo', 'jelly', 'kite', 'lemon',
  'mango', 'nest', 'orange', 'piano', 'queen', 'rabbit',
  'star', 'tiger', 'umbrella', 'violin', 'whale', 'zebra',
];

// Word icons
const WORD_ICONS: Record<string, string> = {
  apple: '🍎', banana: '🍌', cat: '🐱', dog: '🐕', eagle: '🦅', fish: '🐟',
  grape: '🍇', horse: '🐴', igloo: '🏠', jelly: '🍬', kite: '🪁', lemon: '🍋',
  mango: '🥭', nest: '🪺', orange: '🍊', piano: '🎹', queen: '👑', rabbit: '🐰',
  star: '⭐', tiger: '🐯', umbrella: '☂️', violin: '🎻', whale: '🐋', zebra: '🦓',
};

interface Obstacle {
  x: number;
  type: 'hurdle' | 'pit';
}

interface WordCollectable {
  x: number;
  word: string;
  collected: boolean;
}

export default function SeedSprintGame() {
  const router = useRouter();
  const { profile, updateScore, mintBadge, addXP } = useGameStore();
  
  // Audio hook
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [checkpoints, setCheckpoints] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [wordCollectables, setWordCollectables] = useState<WordCollectable[]>([]);
  const [collectedWords, setCollectedWords] = useState<string[]>([]);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [checkpointInput, setCheckpointInput] = useState<string[]>([]);
  const [speed, setSpeed] = useState(5);

  const playerY = useSharedValue(0);
  const groundOffset = useSharedValue(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generate seed phrase
  const generateSeedPhrase = useCallback(() => {
    const shuffled = [...SEED_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const newSeed = generateSeedPhrase();
    setSeedPhrase(newSeed);
    setScore(0);
    setDistance(0);
    setCheckpoints(0);
    setObstacles([]);
    setWordCollectables([]);
    setCollectedWords([]);
    setCheckpointInput([]);
    setSpeed(5);
    playerY.value = 0;
  }, [generateSeedPhrase]);

  // Start game
  const startGame = useCallback(() => {
    initGame();
    setGameState('playing');
    startTimeRef.current = Date.now();
    playGameStart();
  }, [initGame, playGameStart]);

  // Jump
  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumping) return;
    
    playJump();
    setIsJumping(true);
    playerY.value = withSequence(
      withTiming(-100, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );
    
    setTimeout(() => setIsJumping(false), 600);
    if (Platform.OS !== 'web') Vibration.vibrate(10);
  }, [gameState, isJumping]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setDistance(d => d + 1);
      setScore(s => s + 1);

      // Animate ground
      groundOffset.value = withTiming((groundOffset.value - speed) % 100, { duration: 50 });

      // Spawn obstacles
      if (Math.random() < 0.02) {
        setObstacles(prev => [...prev, {
          x: GAME_WIDTH,
          type: Math.random() > 0.5 ? 'hurdle' : 'pit',
        }]);
      }

      // Spawn word collectables (from seed phrase)
      if (collectedWords.length < 12 && Math.random() < 0.01) {
        const availableWords = seedPhrase.filter(w => !collectedWords.includes(w));
        if (availableWords.length > 0) {
          const word = availableWords[Math.floor(Math.random() * availableWords.length)];
          setWordCollectables(prev => [...prev, {
            x: GAME_WIDTH,
            word,
            collected: false,
          }]);
        }
      }

      // Move obstacles
      setObstacles(prev => {
        const newObs = prev.map(o => ({ ...o, x: o.x - speed })).filter(o => o.x > -OBSTACLE_WIDTH);
        
        // Check collision
        for (const obs of newObs) {
          if (obs.x < 60 && obs.x > 20 && playerY.value > -50) {
            // Hit obstacle!
            setGameState('gameover');
            if (Platform.OS !== 'web') Vibration.vibrate(100);
            return newObs;
          }
        }
        
        return newObs;
      });

      // Move word collectables
      setWordCollectables(prev => {
        return prev.map(w => {
          if (!w.collected && w.x < 70 && w.x > 20) {
            // Collect word!
            setCollectedWords(cw => [...cw, w.word]);
            setScore(s => s + 50);
            if (Platform.OS !== 'web') Vibration.vibrate(30);
            return { ...w, collected: true };
          }
          return { ...w, x: w.x - speed };
        }).filter(w => w.x > -WORD_COLLECT_SIZE && !w.collected);
      });

      // Speed increase
      if (distance % 500 === 0) {
        setSpeed(s => Math.min(s + 0.5, 12));
      }

      // Checkpoint every 1000 distance
      if (distance > 0 && distance % 1000 === 0 && collectedWords.length >= 3) {
        setGameState('checkpoint');
        setCheckpointInput([]);
      }
    }, 50);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, speed, distance, collectedWords, seedPhrase]);

  // Animated styles
  const playerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: playerY.value }],
  }));

  // Handle checkpoint
  const handleCheckpointWordSelect = (word: string) => {
    if (checkpointInput.includes(word)) {
      setCheckpointInput(prev => prev.filter(w => w !== word));
    } else if (checkpointInput.length < 3) {
      setCheckpointInput(prev => [...prev, word]);
    }
  };

  const verifyCheckpoint = () => {
    // Check if selected words are in the correct order from collected words
    const correctOrder = collectedWords.slice(0, 3);
    const isCorrect = checkpointInput.every((w, i) => w === correctOrder[i]);
    
    if (isCorrect) {
      setCheckpoints(c => c + 1);
      setScore(s => s + 200);
      setGameState('playing');
      if (Platform.OS !== 'web') Vibration.vibrate(50);
    } else {
      setGameState('gameover');
    }
  };

  // Handle game over
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      updateScore('seed-sprint', score, duration);
      addXP(Math.floor(score / 10));

      axios.post(`${BACKEND_URL}/api/leaderboard`, {
        player_id: profile.id,
        player_name: profile.username,
        game_id: 'seed-sprint',
        score,
        duration,
      }).catch(console.error);

      if (score >= 500) {
        mintBadge({
          name: score >= 2000 ? 'Seed Keeper' : 'Phrase Runner',
          description: score >= 2000 
            ? 'Scored 2000+ in Seed Sprint!' 
            : 'Scored 500+ in Seed Sprint!',
          rarity: score >= 2000 ? 'Epic' : 'Rare',
          gameId: 'seed-sprint',
          traits: { score, distance, words_collected: collectedWords.length, checkpoints },
          icon: score >= 2000 ? '🔑' : '🏃',
        });
      }
    }
  }, [gameState]);

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
          <PixelText size="lg" color={COLORS.seedRed} glow>{score}</PixelText>
        </View>
        
        <View style={styles.distanceContainer}>
          <PixelText size="xs" color={COLORS.textSecondary}>DISTANCE</PixelText>
          <PixelText size="md" color={COLORS.blockCyan}>{distance}m</PixelText>
        </View>
      </View>

      {/* Collected Words */}
      <View style={styles.wordsBar}>
        <PixelText size="xs" color={COLORS.textSecondary}>SEED PHRASE: {collectedWords.length}/12</PixelText>
        <View style={styles.wordsRow}>
          {collectedWords.slice(0, 6).map((word, i) => (
            <View key={i} style={styles.wordBadge}>
              <PixelText size="xs">{WORD_ICONS[word]}</PixelText>
            </View>
          ))}
          {Array(Math.max(0, 6 - collectedWords.length)).fill(0).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.wordBadge, styles.wordBadgeEmpty]} />
          ))}
        </View>
        <View style={styles.wordsRow}>
          {collectedWords.slice(6, 12).map((word, i) => (
            <View key={i} style={styles.wordBadge}>
              <PixelText size="xs">{WORD_ICONS[word]}</PixelText>
            </View>
          ))}
          {Array(Math.max(0, 6 - Math.max(0, collectedWords.length - 6))).fill(0).map((_, i) => (
            <View key={`empty2-${i}`} style={[styles.wordBadge, styles.wordBadgeEmpty]} />
          ))}
        </View>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {/* Ground */}
        <View style={styles.ground} />
        
        {/* Obstacles */}
        {obstacles.map((obs, idx) => (
          <View
            key={idx}
            style={[
              styles.obstacle,
              {
                left: obs.x,
                backgroundColor: obs.type === 'hurdle' ? '#FF4444' : '#333',
                height: obs.type === 'hurdle' ? 40 : 20,
                bottom: obs.type === 'hurdle' ? GROUND_HEIGHT : GROUND_HEIGHT - 10,
              },
            ]}
          />
        ))}

        {/* Word Collectables */}
        {wordCollectables.filter(w => !w.collected).map((w, idx) => (
          <View
            key={idx}
            style={[
              styles.wordCollectable,
              { left: w.x },
            ]}
          >
            <PixelText size="lg">{WORD_ICONS[w.word]}</PixelText>
          </View>
        ))}

        {/* Player */}
        <Animated.View style={[styles.player, playerStyle]}>
          <PixelText size="xl">🏃</PixelText>
        </Animated.View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <PixelText size="xs" color={COLORS.seedRed}>SEED PHRASE LESSON:</PixelText>
        <PixelText size="xs" color={COLORS.textMuted}>
          Collect and memorize all 12 words! At checkpoints, recall them in order to continue.
        </PixelText>
      </View>

      {/* Jump Button */}
      <TouchableOpacity style={styles.jumpButton} onPress={jump} activeOpacity={0.7}>
        <Ionicons name="arrow-up" size={48} color={COLORS.seedRed} />
        <PixelText size="md" color={COLORS.seedRed}>JUMP</PixelText>
      </TouchableOpacity>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <View style={styles.overlay}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
            <PixelText size="xxl" color={COLORS.seedRed} glow>SEED SPRINT</PixelText>
            <PixelText size="md" style={styles.menuIcon}>🏃🔑</PixelText>
            
            <View style={styles.instructionBox}>
              <PixelText size="sm" color={COLORS.chainGold} style={styles.instructionTitle}>
                HOW TO PLAY:
              </PixelText>
              <View style={styles.instructionRow}>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 TAP screen to JUMP over obstacles</PixelText>
              </View>
              <View style={styles.instructionRow}>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 Collect 12 SEED WORDS (shown as icons)</PixelText>
              </View>
              <View style={styles.instructionRow}>
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 At checkpoints, recall words IN ORDER</PixelText>
              </View>
              <View style={styles.instructionRow}>
                <PixelText size="xs" color={COLORS.neonCyan}>💡 Just like protecting your real wallet!</PixelText>
              </View>
            </View>
            
            <PixelButton
              title="START RUNNING"
              onPress={startGame}
              color={COLORS.seedRed}
              size="lg"
              style={{ marginTop: 24 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Checkpoint */}
      {gameState === 'checkpoint' && (
        <View style={styles.overlay}>
          <View style={styles.checkpointContent}>
            <PixelText size="lg" color={COLORS.chainGold} glow>🎯 CHECKPOINT!</PixelText>
            <PixelText size="xs" color={COLORS.textPrimary} style={{ marginVertical: 8 }}>
              Memory test! Tap your first 3 words IN ORDER:
            </PixelText>
            
            <View style={styles.checkpointWords}>
              {collectedWords.slice(0, 6).map((word, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.checkpointWord,
                    checkpointInput.includes(word) && styles.checkpointWordSelected,
                  ]}
                  onPress={() => handleCheckpointWordSelect(word)}
                >
                  <PixelText size="lg">{WORD_ICONS[word]}</PixelText>
                  <PixelText size="xs" color={COLORS.textPrimary}>{word}</PixelText>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.selectedWords}>
              {checkpointInput.map((word, i) => (
                <View key={i} style={styles.selectedWord}>
                  <PixelText size="sm">{i + 1}. {WORD_ICONS[word]}</PixelText>
                </View>
              ))}
            </View>
            
            <PixelButton
              title="VERIFY"
              onPress={verifyCheckpoint}
              color={COLORS.chainGold}
              disabled={checkpointInput.length !== 3}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <View style={styles.overlay}>
          <Animated.View entering={FadeInDown} style={styles.menuContent}>
            <PixelText size="xl" color={COLORS.error} glow>SEED LOST!</PixelText>
            <PixelText size="xxl" color={COLORS.chainGold} style={{ marginVertical: 16 }}>
              {score}
            </PixelText>
            <PixelText size="sm" color={COLORS.textSecondary}>Distance: {distance}m</PixelText>
            <PixelText size="sm" color={COLORS.textSecondary}>Words: {collectedWords.length}/12</PixelText>
            
            {score >= 500 && (
              <View style={styles.badgeEarned}>
                <PixelText size="sm" color={COLORS.success}>🏅 Badge Earned!</PixelText>
              </View>
            )}
            
            <View style={styles.gameOverButtons}>
              <PixelButton title="PLAY AGAIN" onPress={startGame} color={COLORS.seedRed} size="md" />
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
  distanceContainer: { alignItems: 'center' },
  wordsBar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.cardBg, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  wordsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 },
  wordBadge: { width: 32, height: 32, backgroundColor: COLORS.seedRed + '40', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  wordBadgeEmpty: { backgroundColor: COLORS.cardBorder },
  gameArea: { alignSelf: 'center', backgroundColor: '#87CEEB', borderWidth: 2, borderColor: COLORS.seedRed, position: 'relative', overflow: 'hidden' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: GROUND_HEIGHT, backgroundColor: '#8B4513' },
  obstacle: { position: 'absolute', width: OBSTACLE_WIDTH, borderRadius: 4 },
  wordCollectable: { position: 'absolute', bottom: GROUND_HEIGHT + 20, width: WORD_COLLECT_SIZE, height: WORD_COLLECT_SIZE, backgroundColor: COLORS.chainGold + '80', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  player: { position: 'absolute', left: 40, bottom: GROUND_HEIGHT, width: PLAYER_SIZE, height: PLAYER_SIZE, justifyContent: 'center', alignItems: 'center' },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginVertical: 8 },
  jumpButton: { alignSelf: 'center', width: 120, height: 100, backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 3, borderColor: COLORS.seedRed, justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 24, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.seedRed, maxWidth: 340 },
  menuIcon: { fontSize: 48, marginVertical: 12 },
  menuSubtitle: { textAlign: 'center', marginBottom: 8 },
  menuHint: { textAlign: 'center' },
  instructionBox: { backgroundColor: COLORS.bgDark, padding: 16, borderRadius: 12, marginTop: 16, width: '100%' },
  instructionTitle: { marginBottom: 8, textAlign: 'center' },
  instructionRow: { marginVertical: 4 },
  checkpointContent: { alignItems: 'center', padding: 24, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.chainGold, width: SCREEN_WIDTH - 48 },
  checkpointWords: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginVertical: 16 },
  checkpointWord: { width: 70, height: 70, backgroundColor: COLORS.cardBg, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.cardBorder },
  checkpointWordSelected: { borderColor: COLORS.chainGold, backgroundColor: COLORS.chainGold + '30' },
  selectedWords: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  selectedWord: { backgroundColor: COLORS.chainGold + '40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  badgeEarned: { backgroundColor: COLORS.success + '30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
