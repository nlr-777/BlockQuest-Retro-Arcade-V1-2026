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
  ScreenShake,
  ComboDisplay,
  useFloatingScores,
  useComboSystem,
  useDifficultyScaling,
  ParticleBurst,
  LevelUpFlash,
  DangerWarning,
} from '../../src/utils/GameEnhancements';
import { useKeyboardControls, KeyDirection } from '../../src/utils/GameControls';
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
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = 300;
const PLAYER_SIZE = 40;
const GROUND_HEIGHT = 60;
const OBSTACLE_WIDTH = 30;
const WORD_COLLECT_SIZE = 50;

type GameState = 'modeselect' | 'menu' | 'playing' | 'checkpoint' | 'gameover' | 'rewards';

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
  } = useCharacterBonus('seed-sprint');

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
  const [distance, setDistance] = useState(0);
  const [checkpoints, setCheckpoints] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [canDoubleJump, setCanDoubleJump] = useState(true);
  const [jumpCount, setJumpCount] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [wordCollectables, setWordCollectables] = useState<WordCollectable[]>([]);
  const [collectedWords, setCollectedWords] = useState<string[]>([]);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [checkpointInput, setCheckpointInput] = useState<string[]>([]);
  const [speed, setSpeed] = useState(5);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);
  const [shieldUsedThisHit, setShieldUsedThisHit] = useState(false);

  const playerY = useSharedValue(0);
  const groundOffset = useSharedValue(0);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    setJumpCount(0);
    setCanDoubleJump(true);
    setIsJumping(false);
    playerY.value = 0;
  }, [generateSeedPhrase]);

  // Begin gameplay after dialogue
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    setHighScoreBeaten(false);
    setShieldUsedThisHit(false);
    powerUps.resetSession(); // Reset power-ups for new game
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

  // Jump with Double Jump ability! + Power-up effects
  const jump = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // Apply mega_jump power-up modifier (triple jump height!)
    const jumpMultiplier = powerUps.jumpModifier;
    const baseJumpHeight = -200 * jumpMultiplier;
    const doubleJumpHeight = -280 * jumpMultiplier;
    
    // First jump
    if (!isJumping && jumpCount === 0) {
      playJump();
      setIsJumping(true);
      setJumpCount(1);
      
      // First jump - go up high (boosted by mega_jump!)
      playerY.value = withSequence(
        withTiming(baseJumpHeight, { duration: 350 }),  // Jump up
        withTiming(0, { duration: 500 })       // Fall down
      );
      
      // Reset after landing
      setTimeout(() => {
        setIsJumping(false);
        setJumpCount(0);
      }, 850);
      
      if (Platform.OS !== 'web') GameHaptics.light();
    }
    // Double jump! (while in air)
    else if (isJumping && jumpCount === 1 && canDoubleJump) {
      playJump();
      setJumpCount(2);
      setCanDoubleJump(false);
      
      // Double jump - boost even higher from current position! (boosted by mega_jump!)
      playerY.value = withSequence(
        withTiming(doubleJumpHeight, { duration: 300 }),  // Boost up even more!
        withTiming(0, { duration: 600 })       // Fall down slower
      );
      
      // Reset after landing
      setTimeout(() => {
        setIsJumping(false);
        setJumpCount(0);
        setCanDoubleJump(true);
      }, 900);
      
      if (Platform.OS !== 'web') Vibration.vibrate([0, 10, 50, 10]);
    }
  }, [gameState, isJumping, jumpCount, canDoubleJump, playJump, powerUps.jumpModifier]);

  // Keyboard controls for web (Space/Up = Jump)
  const handleKeyDirection = useCallback((dir: KeyDirection) => {
    if (gameState !== 'playing') return;
    if (dir === 'up' || dir === 'action') jump();
  }, [gameState, jump]);

  useKeyboardControls({ onDirection: handleKeyDirection, enabled: gameState === 'playing' });

  // Game loop with power-up effects
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Apply slow_time power-up to game speed
    const effectiveSpeed = speed * powerUps.speedModifier;
    const intervalMs = 50 / powerUps.speedModifier; // Slower updates when slow-motion active

    gameLoopRef.current = setInterval(() => {
      setDistance(d => d + 1);
      // Apply score multiplier from power-ups (double_score, golden_touch)
      setScore(s => s + powerUps.calculateScore(1));

      // Animate ground
      groundOffset.value = withTiming((groundOffset.value - effectiveSpeed) % 100, { duration: 50 });

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
        const newObs = prev.map(o => ({ ...o, x: o.x - effectiveSpeed })).filter(o => o.x > -OBSTACLE_WIDTH);
        
        // Check collision - use isJumping state instead of animated value
        // This is more reliable since animated values don't sync well with React state
        for (const obs of newObs) {
          // Collision zone is when obstacle is near the player (x between 30-55)
          if (obs.x < 55 && obs.x > 30) {
            // If player is jumping (isJumping=true), they clear the obstacle
            // If not jumping, they hit it!
            if (!isJumping) {
              // Check for shield power-up first!
              if (powerUps.hasShield) {
                // Shield absorbs the hit - don't die!
                playCollect(); // Play a "saved" sound
                if (Platform.OS !== 'web') GameHaptics.medium();
                return newObs.filter(o => o !== obs); // Remove the obstacle
              }
              
              // Check for extra life power-up!
              if (powerUps.hasExtraLife && powerUps.useExtraLife()) {
                // Extra life saved us!
                playLevelUp(); // Play a revival sound
                if (Platform.OS !== 'web') Vibration.vibrate([0, 100, 100, 100]);
                return newObs.filter(o => o !== obs); // Remove the obstacle
              }
              
              // Hit obstacle - game over!
              playHit();
              const currentHighScore = highScores?.['seed-sprint'] || 0;
              if (score > currentHighScore) {
                setHighScoreBeaten(true);
              }
              playGameOver();
              setGameState('rewards');
              if (Platform.OS !== 'web') GameHaptics.error();
              return newObs;
            }
          }
        }
        
        return newObs;
      });

      // Move word collectables - with magnet power-up!
      setWordCollectables(prev => {
        return prev.map(w => {
          // Magnet power-up: auto-collect from further away!
          const collectRange = powerUps.hasMagnet ? 150 : 50;
          
          if (!w.collected && w.x < (20 + collectRange) && w.x > 20) {
            // Collect word!
            setCollectedWords(cw => [...cw, w.word]);
            // Apply score multiplier to collection bonus
            setScore(s => s + powerUps.calculateScore(50));
            playCollect();
            if (Platform.OS !== 'web') Vibration.vibrate(30);
            return { ...w, collected: true };
          }
          return { ...w, x: w.x - effectiveSpeed };
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
  }, [gameState, speed, distance, collectedWords, seedPhrase, powerUps]);

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
      if (Platform.OS !== 'web') GameHaptics.medium();
    } else {
      const currentHighScore = highScores?.['seed-sprint'] || 0;
      if (score > currentHighScore) {
        setHighScoreBeaten(true);
      }
      playGameOver();
      setGameState('rewards');
    }
  };

  // Handle game over (after rewards modal)
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Update score (XP is already awarded by GameRewardsModal)
      updateScore('seed-sprint', applyBonus(score), duration);

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

  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    survival.reset();
    setGameState('menu');
  }, []);



  if (gameState === 'modeselect') {
    return (
      <GameModeSelector
        gameTitle="Seed Sprint"
        gameEmoji="🏃"
        gameColor={COLORS.seedRed}
        onSelectMode={handleModeSelect}
        highScores={modeHighScores['seed-sprint'] || { classic: 0, survival: 0 }}
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
        <DangerWarning active={false} />
        
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
          goal={`Collect ${12 - collectedWords.length} more seeds`}
          gameId="seed-sprint"
          showPuns={true}
        />
      )}
      
      {/* Power-Up HUD - Shows available power-ups */}
      {gameState === 'playing' && powerUps.availablePowerUps.length > 0 && (
        <View style={styles.powerUpContainer}>
          <PowerUpHUD onActivate={(p) => { /* Power-up activated */ }} />
        </View>
      )}
      
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

      {/* Game Area - Tappable for jump */}
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={jump}
        style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
      >
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
      </TouchableOpacity>

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
        <PixelText size="sm" color={COLORS.seedRed}>
          {jumpCount === 0 ? 'JUMP' : jumpCount === 1 ? 'DOUBLE!' : '⬆️'}
        </PixelText>
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
                <PixelText size="xs" color={COLORS.textSecondary}>🔹 TAP to JUMP - tap again for DOUBLE JUMP!</PixelText>
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

      {/* Game Rewards Modal - Shows XP with faction bonus! */}
      <GameRewardsModal
        visible={gameState === 'rewards'}
        gameId="seed-sprint"
        gameName="Seed Sprint"
        score={score}
        baseXP={Math.floor(score / 10)}
        isNewHighScore={highScoreBeaten}
        onContinue={handleRewardsContinue}
      />

      {/* Game Over - Using RektScreen */}
      <RektScreen
        visible={gameState === 'gameover'}
        score={score}
        reason={`Distance: ${distance}m | Words: ${collectedWords.length}/12`}
        onRetry={startGame}
        onQuit={() => router.push('/')}
      />
      {/* Character Story Dialogue */}
      <CharacterDialogue
        gameId="seed-sprint"
        visible={showIntroDialogue}
        onDismiss={handleDialogueDismiss}
      />      </ScreenShake>

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
  distanceContainer: { alignItems: 'center' },
  powerUpContainer: { position: 'absolute', top: 100, right: 8, zIndex: 50 },
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
