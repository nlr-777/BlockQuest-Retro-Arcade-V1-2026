// BlockQuest Official - Lightning Dash
// Racer Style Game - Teaches Fast Processing Concepts
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
import { Scanlines } from '../../src/components/RetroEffects';
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

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 50;
const LANE_COUNT = 3;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 60;
const BOLT_SIZE = 20;

// Speed multipliers
const SPEED_LEVELS = [
  { name: 'Normal', color: '#00FF00', multiplier: 1 },
  { name: 'Fast', color: '#FFFF00', multiplier: 1.5 },
  { name: 'Lightning', color: '#00BFFF', multiplier: 2 },
  { name: 'HYPER', color: '#FF00FF', multiplier: 3 },
];

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: 'car' | 'barrier';
}

interface Bolt {
  id: number;
  lane: number;
  y: number;
  collected: boolean;
}

type GameState = 'modeselect' | 'ready' | 'playing' | 'paused' | 'gameover' | 'rewards';

export default function LightningDashGame() {
  const router = useRouter();
  const { submitScore, modeHighScores } = useGameStore();
  
  // Audio hook
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp, playPowerup } = useGameAudio({ musicTrack: 'euphoria' });

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
  } = useCharacterBonus('lightning-dash');

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
  const [speedLevel, setSpeedLevel] = useState(0);
  const [boltsCollected, setBoltsCollected] = useState(0);
  const [boostMeter, setBoostMeter] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);

  // Player state
  const [playerLane, setPlayerLane] = useState(1); // 0, 1, 2

  // Game objects
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bolts, setBolts] = useState<Bolt[]>([]);

  // Road animation
  const [roadOffset, setRoadOffset] = useState(0);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);

  // Refs
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef(0);

  // Get current speed
  const getCurrentSpeed = () => {
    const baseSpeed = 5 + distance / 500;
    const levelMultiplier = SPEED_LEVELS[speedLevel].multiplier;
    const boostMultiplier = isBoosting ? 1.5 : 1;
    return baseSpeed * levelMultiplier * boostMultiplier;
  };

  // Start game
  // Initialize game state
  const initGame = useCallback(() => {
    setPlayerLane(1);
    setObstacles([]);
    setBolts([]);
    setScore(0);
    setDistance(0);
    setSpeedLevel(0);
    setBoltsCollected(0);
    setBoostMeter(0);
    setIsBoosting(false);
    setHighScoreBeaten(false);
  }, []);

  // Begin gameplay after dialogue
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    powerUps.resetSession();
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

  // Move player
  const moveLeft = () => {
    if (playerLane > 0) {
      setPlayerLane(prev => prev - 1);
      if (Platform.OS !== 'web') GameHaptics.light();
    }
  };

  const moveRight = () => {
    if (playerLane < LANE_COUNT - 1) {
      setPlayerLane(prev => prev + 1);
      if (Platform.OS !== 'web') GameHaptics.light();
    }
  };

  // Activate boost
  const activateBoost = () => {
    if (boostMeter >= 100 && !isBoosting) {
      setIsBoosting(true);
      setBoostMeter(0);
      setTimeout(() => setIsBoosting(false), 3000);
      if (Platform.OS !== 'web') GameHaptics.error();
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      const speed = getCurrentSpeed();

      // Update distance and score
      setDistance(prev => prev + speed / 10);
      setScore(prev => prev + Math.floor(speed));

      // Update road animation
      setRoadOffset(prev => (prev + speed) % 40);

      // Spawn obstacles and bolts
      spawnTimerRef.current += 1;
      if (spawnTimerRef.current > 60 / (1 + speedLevel * 0.3)) {
        spawnTimerRef.current = 0;
        
        // Spawn obstacle
        if (Math.random() > 0.3) {
          const lane = Math.floor(Math.random() * LANE_COUNT);
          setObstacles(prev => [...prev, {
            id: Date.now(),
            lane,
            y: -OBSTACLE_HEIGHT,
            type: Math.random() > 0.5 ? 'car' : 'barrier',
          }]);
        }

        // Spawn bolt
        if (Math.random() > 0.6) {
          const lane = Math.floor(Math.random() * LANE_COUNT);
          setBolts(prev => [...prev, {
            id: Date.now() + 1,
            lane,
            y: -BOLT_SIZE,
            collected: false,
          }]);
        }
      }

      // Update obstacles
      setObstacles(prev => prev
        .map(obs => ({ ...obs, y: obs.y + speed }))
        .filter(obs => obs.y < GAME_HEIGHT + OBSTACLE_HEIGHT)
      );

      // Update bolts
      setBolts(prev => prev
        .map(bolt => ({ ...bolt, y: bolt.y + speed }))
        .filter(bolt => bolt.y < GAME_HEIGHT + BOLT_SIZE)
      );

      // Check collisions
      const playerX = playerLane * LANE_WIDTH + LANE_WIDTH / 2;
      const playerY = GAME_HEIGHT - PLAYER_HEIGHT - 30;

      // Obstacle collision
      setObstacles(prev => {
        for (const obs of prev) {
          const obsX = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
          
          if (Math.abs(obsX - playerX) < (PLAYER_WIDTH + OBSTACLE_WIDTH) / 2 &&
              obs.y + OBSTACLE_HEIGHT > playerY &&
              obs.y < playerY + PLAYER_HEIGHT) {
            // Collision!
            playGameOver();
            setHighScoreBeaten(score > 0); // Lightning dash doesn't have high scores stored yet
            setGameState('rewards');
            submitScore('lightning-dash', applyBonus(score));
            if (Platform.OS !== 'web') Vibration.vibrate(300);
            return prev;
          }
        }
        return prev;
      });

      // Bolt collection
      setBolts(prev => prev.map(bolt => {
        if (bolt.collected) return bolt;
        
        const boltX = bolt.lane * LANE_WIDTH + LANE_WIDTH / 2;
        
        if (Math.abs(boltX - playerX) < (PLAYER_WIDTH + BOLT_SIZE) / 2 &&
            bolt.y + BOLT_SIZE > playerY &&
            bolt.y < playerY + PLAYER_HEIGHT) {
          // Collected!
          setBoltsCollected(b => b + 1);
          setBoostMeter(m => Math.min(100, m + 20));
          setScore(s => s + powerUps.calculateScore(50));
          if (Platform.OS !== 'web') Vibration.vibrate(20);
          return { ...bolt, collected: true };
        }
        return bolt;
      }));

      // Update speed level based on distance
      const newSpeedLevel = Math.min(3, Math.floor(distance / 300));
      if (newSpeedLevel !== speedLevel) {
        setSpeedLevel(newSpeedLevel);
      }

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerLane, speedLevel, isBoosting, score, distance, submitScore]);

  const playerX = playerLane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_WIDTH / 2;

  // Keyboard controls for web
  const handleKeyDirection = useCallback((dir: KeyDirection) => {
    if (gameState !== 'playing') return;
    if (dir === 'left') moveLeft();
    if (dir === 'right') moveRight();
  }, [gameState, moveLeft, moveRight]);

  useKeyboardControls({ onDirection: handleKeyDirection, enabled: gameState === 'playing' });

  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    survival.reset();
    setGameState('ready');
  }, []);



  if (gameState === 'modeselect') {
    return (
      <GameModeSelector
        gameTitle="Lightning Dash"
        gameEmoji="⚡"
        gameColor="#FFD700"
        onSelectMode={handleModeSelect}
        highScores={modeHighScores['lightning-dash'] || { classic: 0, survival: 0 }}
        onBack={() => router.back()}
          characterId={selectedCharacterId}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Scanlines opacity={0.05} />
      

        {/* Game Enhancements */}
        <FloatingScoresComponent />
        <ComboDisplay combo={combo} visible={showCombo} />
        <ParticleBurst x={particleBurst.x} y={particleBurst.y} trigger={particleBurst.trigger} color="#FFD700" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LIGHTNING DASH</Text>
            <Text style={[styles.speedIndicator, { color: SPEED_LEVELS[speedLevel].color }]}>
              {SPEED_LEVELS[speedLevel].name.toUpperCase()} MODE
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.distance}>{Math.floor(distance)}m</Text>
          </View>
        </View>

        {/* Boost Bar */}
        <View style={styles.boostBar}>
          <Text style={styles.boostLabel}>⚡ BOOST</Text>
          <View style={styles.boostTrack}>
            <View style={[styles.boostFill, { width: `${boostMeter}%` }]} />
          </View>
          <Text style={styles.boltsText}>{boltsCollected}</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Road background with lanes */}
          <View style={styles.road}>
            {/* Lane dividers */}
            {[1, 2].map(i => (
              <View key={i} style={[styles.laneDivider, { left: i * LANE_WIDTH - 2 }]}>
                {[...Array(12)].map((_, j) => (
                  <View
                    key={j}
                    style={[
                      styles.dashLine,
                      { top: (j * 40 + roadOffset) % (GAME_HEIGHT + 40) - 40 },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Obstacles */}
          {obstacles.map(obs => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                {
                  left: obs.lane * LANE_WIDTH + LANE_WIDTH / 2 - OBSTACLE_WIDTH / 2,
                  top: obs.y,
                  backgroundColor: obs.type === 'car' ? '#FF4444' : '#888888',
                },
              ]}
            >
              <Text style={styles.obstacleIcon}>
                {obs.type === 'car' ? '🚗' : '🚧'}
              </Text>
            </View>
          ))}

          {/* Bolts */}
          {bolts.filter(b => !b.collected).map(bolt => (
            <View
              key={bolt.id}
              style={[
                styles.bolt,
                {
                  left: bolt.lane * LANE_WIDTH + LANE_WIDTH / 2 - BOLT_SIZE / 2,
                  top: bolt.y,
                },
              ]}
            >
              <Text style={styles.boltIcon}>⚡</Text>
            </View>
          ))}

          {/* Player */}
          <View
            style={[
              styles.player,
              {
                left: playerX,
                bottom: 30,
                borderColor: isBoosting ? '#00FFFF' : SPEED_LEVELS[speedLevel].color,
              },
            ]}
          >
            <View style={[styles.playerBody, { backgroundColor: isBoosting ? '#00FFFF' : COLORS.neonPink }]} />
            <View style={styles.playerWindshield} />
            {isBoosting && <View style={styles.boostFlame} />}
          </View>

          {/* Speed lines when boosting */}
          {isBoosting && (
            <View style={styles.speedLines}>
              {[...Array(10)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.speedLine,
                    {
                      left: 10 + (i * (GAME_WIDTH - 20)) / 10,
                      top: (i * 40 + roadOffset * 3) % GAME_HEIGHT,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>LIGHTNING DASH</Text>
              <Text style={styles.overlayIcon}>⚡</Text>
              <Text style={styles.overlayText}>Race and collect lightning bolts!</Text>
              <Text style={styles.overlayHint}>Fill boost meter for HYPER speed!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Rewards Modal */}
          <GameRewardsModal
            visible={gameState === 'rewards'}
            gameId="lightning-dash"
            gameName="Lightning Dash"
            score={score}
            baseXP={Math.floor(score / 10)}
            isNewHighScore={highScoreBeaten}
            onContinue={handleRewardsContinue}
          />

          {/* Game Over - Using RektScreen */}
          <RektScreen
            visible={gameState === 'gameover'}
            score={score}
            reason={`Distance: ${Math.floor(distance)}m | Bolts: ${boltsCollected}`}
            onRetry={startGame}
            onQuit={() => router.push('/')}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.laneBtn} onPress={moveLeft}>
            <Text style={styles.laneBtnText}>◀</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.boostBtn, boostMeter >= 100 && styles.boostBtnReady]}
            onPress={activateBoost}
            disabled={boostMeter < 100}
          >
            <Text style={styles.boostBtnText}>⚡ BOOST</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.laneBtn} onPress={moveRight}>
            <Text style={styles.laneBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
        
        {/* Character Story Dialogue */}
        <CharacterDialogue
          gameId="lightning-dash"
          visible={showIntroDialogue}
          onDismiss={handleDialogueDismiss}
        />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { padding: 8 },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#00BFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  speedIndicator: { fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statsContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  distance: { fontSize: 10, color: COLORS.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  boostBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  boostLabel: { fontSize: 10, color: COLORS.neonYellow, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  boostTrack: { flex: 1, height: 10, backgroundColor: COLORS.bgMedium, borderRadius: 5, overflow: 'hidden' },
  boostFill: { height: '100%', backgroundColor: '#00BFFF', borderRadius: 5 },
  boltsText: { fontSize: 12, color: COLORS.neonYellow, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', width: 30 },
  gameArea: { alignSelf: 'center', backgroundColor: '#1a1a2e', borderRadius: 8, borderWidth: 2, borderColor: '#00BFFF', position: 'relative', overflow: 'hidden' },
  road: { ...StyleSheet.absoluteFillObject, backgroundColor: '#2a2a3e' },
  laneDivider: { position: 'absolute', width: 4, top: 0, bottom: 0 },
  dashLine: { position: 'absolute', width: 4, height: 20, backgroundColor: '#FFD700' },
  obstacle: { position: 'absolute', width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  obstacleIcon: { fontSize: 30 },
  bolt: { position: 'absolute', width: BOLT_SIZE, height: BOLT_SIZE, justifyContent: 'center', alignItems: 'center' },
  boltIcon: { fontSize: 20 },
  player: { position: 'absolute', width: PLAYER_WIDTH, height: PLAYER_HEIGHT, borderRadius: 6, borderWidth: 2 },
  playerBody: { flex: 1, borderRadius: 4, margin: 2 },
  playerWindshield: { position: 'absolute', top: 8, left: 5, right: 5, height: 12, backgroundColor: '#00BFFF', borderRadius: 3 },
  boostFlame: { position: 'absolute', bottom: -15, left: PLAYER_WIDTH / 2 - 8, width: 16, height: 20, backgroundColor: '#FF6600', borderRadius: 8 },
  speedLines: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  speedLine: { position: 'absolute', width: 3, height: 30, backgroundColor: 'rgba(0, 255, 255, 0.5)', borderRadius: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 2, 33, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayTitle: { fontSize: 24, fontWeight: 'bold', color: '#00BFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayIcon: { fontSize: 50, marginVertical: 8 },
  overlayScore: { fontSize: 22, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  overlayHint: { fontSize: 10, color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 8 },
  lessonText: { fontSize: 11, color: COLORS.neonCyan, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', marginVertical: 12, paddingHorizontal: 16 },
  startBtn: { backgroundColor: '#00BFFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  laneBtn: { width: 70, height: 70, backgroundColor: COLORS.bgMedium, borderRadius: 12, borderWidth: 2, borderColor: '#00BFFF', justifyContent: 'center', alignItems: 'center' },
  laneBtnText: { fontSize: 28, color: '#00BFFF', fontWeight: 'bold' },
  boostBtn: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.bgMedium, borderRadius: 8, borderWidth: 2, borderColor: COLORS.textMuted, opacity: 0.5 },
  boostBtnReady: { borderColor: '#00BFFF', backgroundColor: '#00BFFF30', opacity: 1 },
  boostBtnText: { fontSize: 14, fontWeight: 'bold', color: '#00BFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
