// Block Quest Official - Chain Invaders (Space Invaders Style Game)
// Teaches: Consensus Mechanism - Defending the network
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
  withSequence,
  withTiming,
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
import { RektScreen } from '../../src/components/RektScreen';
import { RoastHUD } from '../../src/components/RoastHUD';
import { PowerUpHUD } from '../../src/components/PowerUpBar';
import { usePowerUpEffects } from '../../src/hooks/usePowerUpEffects';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { CharacterDialogue } from '../../src/components/CharacterDialogue';
import { useCharacterBonus } from '../../src/hooks/useCharacterBonus';
import { useCharacterStore } from '../../src/store/characterStore';
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
import {
  useKeyboardControls,
  EnhancedDPad,
  KeyDirection,
} from '../../src/utils/GameControls';
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
const GAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const INVADER_SIZE = 24;
const BULLET_SIZE = 4;
const INVADER_ROWS = 4;
const INVADER_COLS = 8;

type Position = { x: number; y: number };
type GameState = 'modeselect' | 'menu' | 'playing' | 'paused' | 'gameover' | 'rewards' | 'victory';

interface Invader extends Position {
  alive: boolean;
  type: number;
}

interface Bullet extends Position {
  active: boolean;
}

interface PowerUp extends Position {
  type: 'rapid' | 'shield' | 'spread';
  active: boolean;
}

// Invader component
const InvaderSprite: React.FC<{ invader: Invader }> = ({ invader }) => {
  const wobble = useSharedValue(0);

  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 500 }),
        withTiming(-3, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wobble.value }],
  }));

  const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44'];

  return (
    <Animated.View
      style={[
        styles.invader,
        {
          left: invader.x,
          top: invader.y,
          backgroundColor: colors[invader.type % colors.length],
        },
        animatedStyle,
      ]}
    >
      <View style={styles.invaderEyes}>
        <View style={styles.invaderEye} />
        <View style={styles.invaderEye} />
      </View>
    </Animated.View>
  );
};

export default function ChainInvadersGame() {
  const router = useRouter();
  const { profile, updateScore, mintBadge, addXP, highScores } = useGameStore();
  
  // Audio hook for game sounds and music
  const { 
    playShoot, playCollect, playHit, playGameStart, playGameOver, 
    playLevelUp, playPowerup, playMove 
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
    abilityIcon 
  } = useCharacterBonus('chain-invaders');

  // Character dialogue state
  const [showIntroDialogue, setShowIntroDialogue] = useState(false);
  const { getSelectedCharacter } = useCharacterStore();

  // Game state
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
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>([]);
  const [invaderDirection, setInvaderDirection] = useState<1 | -1>(1);
  const [consensusVotes, setConsensusVotes] = useState(0);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [hasShield, setHasShield] = useState(false);
  const [rapidFire, setRapidFire] = useState(false);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastShotRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Initialize invaders
  const initInvaders = useCallback(() => {
    const newInvaders: Invader[] = [];
    const startX = (GAME_WIDTH - INVADER_COLS * (INVADER_SIZE + 8)) / 2;
    const startY = 40;

    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        newInvaders.push({
          x: startX + col * (INVADER_SIZE + 8),
          y: startY + row * (INVADER_SIZE + 8),
          alive: true,
          type: row,
        });
      }
    }
    return newInvaders;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setInvaders(initInvaders());
    setBullets([]);
    setEnemyBullets([]);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    setScore(0);
    setLives(3);
    setWave(1);
    setInvaderDirection(1);
    setConsensusVotes(0);
    setHasShield(false);
    setRapidFire(false);
    setPowerUp(null);
  }, [initInvaders]);

  // Begin gameplay after dialogue
  const beginGameplay = useCallback(() => {
    setGameState('playing');
    powerUps.resetSession();
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

  // Move player
  const movePlayer = useCallback((direction: -1 | 1) => {
    playMove();
    setPlayerX(prev => {
      const newX = prev + direction * 15;
      return Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, newX));
    });
  }, [playMove]);

  // Shoot
  const shoot = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    const cooldown = rapidFire ? 100 : 300;
    if (now - lastShotRef.current < cooldown) return;
    lastShotRef.current = now;

    const newBullet: Bullet = {
      x: playerX + PLAYER_WIDTH / 2 - BULLET_SIZE / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
      active: true,
    };

    setBullets(prev => [...prev, newBullet]);
    playShoot();
    if (Platform.OS !== 'web') Vibration.vibrate(10);
  }, [gameState, playerX, rapidFire, playShoot]);

  // Keyboard controls for web
  const handleKeyDirection = useCallback((dir: KeyDirection) => {
    if (gameState !== 'playing') return;
    switch (dir) {
      case 'left': movePlayer(-1); break;
      case 'right': movePlayer(1); break;
      case 'action': shoot(); break;
    }
  }, [gameState, movePlayer, shoot]);

  useKeyboardControls({ onDirection: handleKeyDirection, enabled: gameState === 'playing' });

  // Vote for power-up (DAO mechanic)
  const voteForPowerUp = useCallback((type: 'rapid' | 'shield' | 'spread') => {
    if (consensusVotes < 10) return;
    
    setConsensusVotes(0);
    playPowerup();
    
    if (type === 'shield') {
      setHasShield(true);
      setTimeout(() => setHasShield(false), 5000);
    } else if (type === 'rapid') {
      setRapidFire(true);
      setTimeout(() => setRapidFire(false), 5000);
    }
    
    if (Platform.OS !== 'web') Vibration.vibrate(50);
  }, [consensusVotes, playPowerup]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Move bullets
      setBullets(prev => prev
        .map(b => ({ ...b, y: b.y - 10 }))
        .filter(b => b.y > 0 && b.active)
      );

      // Move enemy bullets
      setEnemyBullets(prev => prev
        .map(b => ({ ...b, y: b.y + 6 }))
        .filter(b => b.y < GAME_HEIGHT)
      );

      // Move invaders
      setInvaders(prev => {
        const aliveInvaders = prev.filter(i => i.alive);
        if (aliveInvaders.length === 0) return prev;

        const leftmost = Math.min(...aliveInvaders.map(i => i.x));
        const rightmost = Math.max(...aliveInvaders.map(i => i.x));

        let newDirection = invaderDirection;
        let moveDown = false;

        if (rightmost > GAME_WIDTH - INVADER_SIZE - 10 && invaderDirection === 1) {
          newDirection = -1;
          moveDown = true;
        } else if (leftmost < 10 && invaderDirection === -1) {
          newDirection = 1;
          moveDown = true;
        }

        if (newDirection !== invaderDirection) {
          setInvaderDirection(newDirection);
        }

        return prev.map(inv => ({
          ...inv,
          x: inv.x + newDirection * 2,
          y: inv.y + (moveDown ? 10 : 0),
        }));
      });

      // Enemy shooting
      if (Math.random() < 0.02) {
        const aliveInvaders = invaders.filter(i => i.alive);
        if (aliveInvaders.length > 0) {
          const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
          setEnemyBullets(prev => [...prev, {
            x: shooter.x + INVADER_SIZE / 2,
            y: shooter.y + INVADER_SIZE,
            active: true,
          }]);
        }
      }

      // Check bullet-invader collisions
      setBullets(prevBullets => {
        setInvaders(prevInvaders => {
          const newInvaders = [...prevInvaders];
          const newBullets = [...prevBullets];

          for (let b = 0; b < newBullets.length; b++) {
            if (!newBullets[b].active) continue;
            for (let i = 0; i < newInvaders.length; i++) {
              if (!newInvaders[i].alive) continue;

              const bullet = newBullets[b];
              const inv = newInvaders[i];

              if (
                bullet.x < inv.x + INVADER_SIZE &&
                bullet.x + BULLET_SIZE > inv.x &&
                bullet.y < inv.y + INVADER_SIZE &&
                bullet.y + BULLET_SIZE > inv.y
              ) {
                newInvaders[i].alive = false;
                newBullets[b].active = false;
                
                // Enhanced scoring with combo
                const basePoints = (4 - inv.type) * 10;
                const comboMultiplier = getMultiplier();
                const totalPoints = Math.floor(basePoints * comboMultiplier * difficulty.scoreMultiplier);
                setScore(s => s + totalPoints);
                incrementCombo();
                
                // Visual feedback
                addPopup(totalPoints, inv.x, inv.y, combo >= 3 ? 'combo' : 'normal');
                if (combo >= 3) {
                  setParticleBurst({ x: inv.x, y: inv.y, trigger: Date.now() });
                }
                GameHaptics.medium();
                
                setConsensusVotes(v => Math.min(v + 1, 15));
                break;
              }
            }
          }

          return newInvaders;
        });

        return prevBullets.filter(b => b.active);
      });

      // Check enemy bullet-player collision
      setEnemyBullets(prev => {
        for (const bullet of prev) {
          if (
            bullet.x > playerX &&
            bullet.x < playerX + PLAYER_WIDTH &&
            bullet.y > GAME_HEIGHT - PLAYER_HEIGHT - 20 &&
            bullet.y < GAME_HEIGHT - 20
          ) {
            // Check badge-based shield power-up first!
            if (powerUps.hasShield) {
              // Badge shield absorbs the hit!
              playCollect();
              GameHaptics.medium();
              return prev.filter(b => b !== bullet);
            }
            if (hasShield) {
              setHasShield(false);
              GameHaptics.warning();
            } else {
              // Check for extra life power-up!
              if (powerUps.hasExtraLife && powerUps.useExtraLife()) {
                playLevelUp();
                GameHaptics.success();
                return prev.filter(b => b !== bullet);
              }
              
              // Player hit - reset combo, shake screen
              resetCombo();
              setShakeCount(prev => prev + 1);
              GameHaptics.error();
              
              setLives(l => {
                if (l <= 1) {
                  const currentHighScore = highScores?.['chain-invaders'] || 0;
                  if (score > currentHighScore) {
                    setHighScoreBeaten(true);
                  }
                  playGameOver();
                  setGameState('rewards');
                  return 0;
                }
                return l - 1;
              });
            }
            if (Platform.OS !== 'web') Vibration.vibrate(100);
            return prev.filter(b => b !== bullet);
          }
        }
        return prev;
      });

      // Check victory
      if (invaders.every(i => !i.alive)) {
        setWave(w => w + 1);
        setInvaders(initInvaders());
        setScore(s => s + 500);
      }

      // Check if invaders reached bottom
      if (invaders.some(i => i.alive && i.y > GAME_HEIGHT - 60)) {
        const currentHighScore = highScores?.['chain-invaders'] || 0;
        if (score > currentHighScore) {
          setHighScoreBeaten(true);
        }
        playGameOver();
        setGameState('rewards');
      }
    }, 50);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, invaders, playerX, invaderDirection, hasShield, initInvaders]);

  // Handle game over (after rewards modal)
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Update score (XP is already awarded by GameRewardsModal)
      updateScore('chain-invaders', applyBonus(score), duration);

      axios.post(`${BACKEND_URL}/api/leaderboard`, {
        player_id: profile.id,
        player_name: profile.username,
        game_id: 'chain-invaders',
        score,
        duration,
      }).catch(console.error);

      if (score >= 500) {
        mintBadge({
          name: score >= 2000 ? 'Network Guardian' : 'Chain Defender',
          description: score >= 2000 
            ? 'Scored 2000+ in Chain Invaders!' 
            : 'Scored 500+ in Chain Invaders!',
          rarity: score >= 2000 ? 'Epic' : 'Rare',
          gameId: 'chain-invaders',
          traits: { score, wave, consensus_votes_earned: consensusVotes },
          icon: score >= 2000 ? '🛡️' : '⚔️',
        });
      }
    }
  }, [gameState]);

  // Mode selector handler
  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    survival.reset();
    setGameState('menu');
  }, []);



  // Mode selector screen
  if (gameState === 'modeselect') {
    return (
      <GameModeSelector
        gameTitle="Chain Invaders"
        gameEmoji="👾"
        gameColor={COLORS.tokenPurple}
        onSelectMode={handleModeSelect}
        onBack={() => router.back()}
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
        <DangerWarning active={lives === 1 && gameState === 'playing'} />
        
        {/* Particle Burst */}
        <ParticleBurst 
          x={particleBurst.x} 
          y={particleBurst.y} 
          trigger={particleBurst.trigger}
          color="#9945FF"
        />
        
        {/* Roast HUD - Shows during gameplay */}
        {gameState === 'playing' && (
          <RoastHUD
            score={score}
            lives={lives}
            goal={`Defend wave ${wave}!`}
            gameId="chain-invaders"
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
            <PixelText size="lg" color={COLORS.tokenPurple} glow>{score}</PixelText>
            {combo > 1 && (
              <PixelText size="xs" color="#00FFFF">{combo}x COMBO</PixelText>
            )}
          </View>
          
          <View style={styles.livesContainer}>
          {Array(lives).fill(0).map((_, i) => (
            <PixelText key={i} size="md">💜</PixelText>
          ))}
        </View>
        
        <View style={styles.waveContainer}>
          <PixelText size="xs" color={COLORS.textSecondary}>WAVE</PixelText>
          <PixelText size="md" color={COLORS.blockCyan}>{wave}</PixelText>
        </View>
      </View>

      {/* Consensus Vote Bar */}
      <View style={styles.voteBar}>
        <PixelText size="xs" color={COLORS.textSecondary}>CONSENSUS: {consensusVotes}/10</PixelText>
        <View style={styles.voteProgress}>
          <View style={[styles.voteFill, { width: `${(consensusVotes / 10) * 100}%` }]} />
        </View>
        {consensusVotes >= 10 && (
          <View style={styles.voteButtons}>
            <TouchableOpacity
              style={[styles.voteButton, { backgroundColor: '#FF6B6B' }]}
              onPress={() => voteForPowerUp('shield')}
            >
              <PixelText size="xs" color="#FFF">🛡️ SHIELD</PixelText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteButton, { backgroundColor: '#4ECDC4' }]}
              onPress={() => voteForPowerUp('rapid')}
            >
              <PixelText size="xs" color="#FFF">⚡ RAPID</PixelText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {/* Invaders */}
        {invaders.filter(i => i.alive).map((inv, idx) => (
          <InvaderSprite key={idx} invader={inv} />
        ))}

        {/* Bullets */}
        {bullets.map((bullet, idx) => (
          <View
            key={`bullet-${idx}`}
            style={[
              styles.bullet,
              { left: bullet.x, top: bullet.y },
            ]}
          />
        ))}

        {/* Enemy Bullets */}
        {enemyBullets.map((bullet, idx) => (
          <View
            key={`enemy-bullet-${idx}`}
            style={[
              styles.enemyBullet,
              { left: bullet.x, top: bullet.y },
            ]}
          />
        ))}

        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: playerX,
              bottom: 20,
              borderColor: hasShield ? COLORS.chainGold : COLORS.tokenPurple,
            },
          ]}
        >
          {hasShield && <View style={styles.shield} />}
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <PixelText size="xs" color={COLORS.tokenPurple}>CONSENSUS LESSON:</PixelText>
        <PixelText size="xs" color={COLORS.textMuted}>
          Destroy invaders to earn votes. Use votes to activate power-ups - just like DAO governance!
        </PixelText>
      </View>

      {/* Controls - Enhanced with EnhancedDPad */}
      <View style={styles.controls}>
        <EnhancedDPad
          onUp={() => {}}
          onDown={() => {}}
          onLeft={() => movePlayer(-1)}
          onRight={() => movePlayer(1)}
          onAction={shoot}
          size="md"
          color={combo >= 5 ? '#FF00FF' : combo >= 3 ? '#00FFFF' : COLORS.tokenPurple}
          disabled={gameState !== 'playing'}
        />
      </View>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <View style={styles.overlay}>
          <VFXLayer type="pixel-chain-rain" intensity={0.5} />
          <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
            <PixelText size="xxl" color={COLORS.tokenPurple} glow>CHAIN INVADERS</PixelText>
            <PixelText size="md" style={styles.menuIcon}>👽</PixelText>
            <PixelText size="sm" color={COLORS.textSecondary} style={styles.menuSubtitle}>
              Defend your blockchain from alien attacks!
            </PixelText>
            <PixelText size="xs" color={COLORS.blockCyan} style={styles.menuHint}>
              Earn consensus votes to unlock power-ups!
            </PixelText>
            <PixelButton
              title="START GAME"
              onPress={startGame}
              color={COLORS.tokenPurple}
              size="lg"
              style={{ marginTop: 32 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Game Rewards Modal - Shows XP with faction bonus! */}
      <GameRewardsModal
        visible={gameState === 'rewards'}
        gameId="chain-invaders"
        gameName="Chain Invaders"
        score={score}
        baseXP={Math.floor(score / 10)}
        isNewHighScore={highScoreBeaten}
        onContinue={handleRewardsContinue}
      />

      {/* Game Over - Using RektScreen */}
      <RektScreen
        visible={gameState === 'gameover'}
        score={score}
        reason={`Wave: ${wave} | Consensus: ${consensusVotes}`}
        onRetry={startGame}
        onQuit={() => router.push('/')}
      />
      {/* Character Story Dialogue */}
      <CharacterDialogue
        gameId="chain-invaders"
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
      </ScreenShake>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scoreContainer: { alignItems: 'center' },
  livesContainer: { flexDirection: 'row' },
  waveContainer: { alignItems: 'center' },
  voteBar: { paddingHorizontal: 16, marginBottom: 8 },
  voteProgress: { height: 8, backgroundColor: COLORS.cardBg, borderRadius: 4, marginTop: 4 },
  voteFill: { height: '100%', backgroundColor: COLORS.chainGold, borderRadius: 4 },
  voteButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  voteButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  gameArea: { alignSelf: 'center', backgroundColor: COLORS.bgMedium, borderWidth: 2, borderColor: COLORS.tokenPurple, position: 'relative', overflow: 'hidden' },
  invader: { position: 'absolute', width: INVADER_SIZE, height: INVADER_SIZE, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  invaderEyes: { flexDirection: 'row', gap: 4 },
  invaderEye: { width: 4, height: 6, backgroundColor: '#FFF', borderRadius: 2 },
  bullet: { position: 'absolute', width: BULLET_SIZE, height: 12, backgroundColor: COLORS.chainGold },
  enemyBullet: { position: 'absolute', width: BULLET_SIZE, height: 10, backgroundColor: COLORS.error },
  player: { position: 'absolute', width: PLAYER_WIDTH, height: PLAYER_HEIGHT, backgroundColor: COLORS.tokenPurple, borderRadius: 4, borderWidth: 2 },
  shield: { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 8, borderWidth: 2, borderColor: COLORS.chainGold, opacity: 0.5 },
  infoBox: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, marginHorizontal: 16, marginVertical: 8 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 24 },
  controlButton: { width: 64, height: 64, backgroundColor: COLORS.cardBg, borderRadius: 32, borderWidth: 2, borderColor: COLORS.tokenPurple, justifyContent: 'center', alignItems: 'center' },
  fireButton: { width: 80, height: 80, borderColor: COLORS.seedRed },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  menuContent: { alignItems: 'center', padding: 32, backgroundColor: COLORS.bgMedium, borderRadius: 16, borderWidth: 2, borderColor: COLORS.tokenPurple, maxWidth: 320 },
  menuIcon: { fontSize: 60, marginVertical: 16 },
  menuSubtitle: { textAlign: 'center', marginBottom: 8 },
  menuHint: { textAlign: 'center' },
  badgeEarned: { backgroundColor: COLORS.success + '30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
  gameOverButtons: { gap: 12, marginTop: 24 },
});
