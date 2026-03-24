// Shared Survival Mode Engine
// Provides power-ups, difficulty waves, boss events, and scoring multipliers

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// POWER-UP SYSTEM
// ============================================================

export type PowerUpType = 'shield' | 'speed' | 'magnet' | 'double' | 'freeze';

export interface PowerUp {
  type: PowerUpType;
  emoji: string;
  name: string;
  duration: number; // seconds
  color: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUp> = {
  shield: { type: 'shield', emoji: '🛡️', name: 'SHIELD', duration: 8, color: '#00BFFF' },
  speed: { type: 'speed', emoji: '⚡', name: 'SPEED', duration: 6, color: '#FFD700' },
  magnet: { type: 'magnet', emoji: '🧲', name: 'MAGNET', duration: 10, color: '#FF6AD5' },
  double: { type: 'double', emoji: '✖️2', name: 'DOUBLE', duration: 12, color: '#39FF14' },
  freeze: { type: 'freeze', emoji: '❄️', name: 'FREEZE', duration: 5, color: '#00FFFF' },
};

// ============================================================
// SURVIVAL ENGINE HOOK
// ============================================================

interface SurvivalState {
  timeAlive: number;
  multiplier: number;
  wave: number;
  waveTimer: number;
  activePowerUp: PowerUp | null;
  powerUpTimer: number;
  isBossWave: boolean;
  bossHealth: number;
  difficultyScale: number;
  spawnedPowerUp: PowerUpType | null;
}

interface UseSurvivalEngineOptions {
  enabled: boolean;
  waveInterval?: number;     // seconds between difficulty waves (default: 30)
  bossInterval?: number;     // seconds between boss events (default: 120)
  powerUpInterval?: number;  // seconds between power-up spawns (default: 20)
  onWaveChange?: (wave: number) => void;
  onBossSpawn?: () => void;
  onBossDefeat?: () => void;
  onPowerUpSpawn?: (type: PowerUpType) => void;
  onPowerUpExpire?: () => void;
}

export function useSurvivalEngine(options: UseSurvivalEngineOptions) {
  const {
    enabled,
    waveInterval = 30,
    bossInterval = 120,
    powerUpInterval = 20,
    onWaveChange,
    onBossSpawn,
    onBossDefeat,
    onPowerUpSpawn,
    onPowerUpExpire,
  } = options;

  const [state, setState] = useState<SurvivalState>({
    timeAlive: 0,
    multiplier: 1.0,
    wave: 1,
    waveTimer: waveInterval,
    activePowerUp: null,
    powerUpTimer: 0,
    isBossWave: false,
    bossHealth: 0,
    difficultyScale: 1.0,
    spawnedPowerUp: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Main survival tick - runs every second
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeAlive + 1;
        let newWave = prev.wave;
        let newWaveTimer = prev.waveTimer - 1;
        let newMultiplier = Math.min(5.0, 1.0 + (newTime * 0.03));
        let newIsBoss = prev.isBossWave;
        let newBossHealth = prev.bossHealth;
        let newDifficulty = 1.0 + (newTime * 0.02);
        let newActivePowerUp = prev.activePowerUp;
        let newPowerUpTimer = prev.powerUpTimer;
        let newSpawnedPowerUp = prev.spawnedPowerUp;

        // Wave progression
        if (newWaveTimer <= 0) {
          newWave = prev.wave + 1;
          newWaveTimer = waveInterval;
          newDifficulty *= 1.1;
          onWaveChange?.(newWave);
        }

        // Boss spawn
        if (newTime > 0 && newTime % bossInterval === 0 && !prev.isBossWave) {
          newIsBoss = true;
          newBossHealth = 100;
          onBossSpawn?.();
        }

        // Power-up spawn
        if (newTime > 0 && newTime % powerUpInterval === 0 && !prev.spawnedPowerUp) {
          const types: PowerUpType[] = ['shield', 'speed', 'magnet', 'double', 'freeze'];
          const randomType = types[Math.floor(Math.random() * types.length)];
          newSpawnedPowerUp = randomType;
          onPowerUpSpawn?.(randomType);
        }

        // Active power-up countdown
        if (newActivePowerUp && newPowerUpTimer > 0) {
          newPowerUpTimer -= 1;
          if (newPowerUpTimer <= 0) {
            newActivePowerUp = null;
            onPowerUpExpire?.();
          }
        }

        return {
          timeAlive: newTime,
          multiplier: newMultiplier,
          wave: newWave,
          waveTimer: newWaveTimer,
          activePowerUp: newActivePowerUp,
          powerUpTimer: newPowerUpTimer,
          isBossWave: newIsBoss,
          bossHealth: newBossHealth,
          difficultyScale: newDifficulty,
          spawnedPowerUp: newSpawnedPowerUp,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, waveInterval, bossInterval, powerUpInterval]);

  // Collect a spawned power-up
  const collectPowerUp = useCallback(() => {
    setState(prev => {
      if (!prev.spawnedPowerUp) return prev;
      const powerUp = POWER_UPS[prev.spawnedPowerUp];
      return {
        ...prev,
        activePowerUp: powerUp,
        powerUpTimer: powerUp.duration,
        spawnedPowerUp: null,
      };
    });
  }, []);

  // Damage boss
  const damageBoss = useCallback((damage: number) => {
    setState(prev => {
      if (!prev.isBossWave) return prev;
      const newHealth = Math.max(0, prev.bossHealth - damage);
      if (newHealth === 0) {
        onBossDefeat?.();
        return { ...prev, isBossWave: false, bossHealth: 0, multiplier: prev.multiplier + 0.5 };
      }
      return { ...prev, bossHealth: newHealth };
    });
  }, [onBossDefeat]);

  // Reset engine
  const reset = useCallback(() => {
    setState({
      timeAlive: 0,
      multiplier: 1.0,
      wave: 1,
      waveTimer: waveInterval,
      activePowerUp: null,
      powerUpTimer: 0,
      isBossWave: false,
      bossHealth: 0,
      difficultyScale: 1.0,
      spawnedPowerUp: null,
    });
  }, [waveInterval]);

  return {
    ...state,
    collectPowerUp,
    damageBoss,
    reset,
    hasShield: state.activePowerUp?.type === 'shield',
    hasSpeed: state.activePowerUp?.type === 'speed',
    hasMagnet: state.activePowerUp?.type === 'magnet',
    hasDouble: state.activePowerUp?.type === 'double',
    hasFreeze: state.activePowerUp?.type === 'freeze',
  };
}

// ============================================================
// SURVIVAL HUD COMPONENT (Enhanced)
// ============================================================

interface SurvivalOverlayProps {
  timeAlive: number;
  multiplier: number;
  wave: number;
  waveTimer: number;
  activePowerUp: PowerUp | null;
  powerUpTimer: number;
  isBossWave: boolean;
  bossHealth: number;
  color: string;
  visible: boolean;
}

export const SurvivalOverlay: React.FC<SurvivalOverlayProps> = ({
  timeAlive, multiplier, wave, waveTimer, activePowerUp, powerUpTimer,
  isBossWave, bossHealth, color, visible,
}) => {
  if (!visible) return null;

  const mins = Math.floor(timeAlive / 60);
  const secs = timeAlive % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={hudStyles.container}>
      {/* Top bar: Time | Wave | Multiplier */}
      <View style={hudStyles.topBar}>
        <View style={hudStyles.stat}>
          <Text style={hudStyles.label}>TIME</Text>
          <Text style={[hudStyles.value, { color }]}>{timeStr}</Text>
        </View>
        <View style={hudStyles.stat}>
          <Text style={hudStyles.label}>WAVE</Text>
          <Text style={[hudStyles.value, { color: wave >= 5 ? '#FF073A' : color }]}>{wave}</Text>
        </View>
        <View style={hudStyles.stat}>
          <Text style={hudStyles.label}>MULTI</Text>
          <Text style={[hudStyles.value, { color: multiplier >= 3 ? '#FF073A' : multiplier >= 2 ? '#FF6600' : color }]}>
            x{multiplier.toFixed(1)}
          </Text>
        </View>
        {waveTimer <= 5 && (
          <Animated.View entering={FadeIn} style={hudStyles.waveWarning}>
            <Text style={hudStyles.waveWarningText}>⚠️ {waveTimer}s</Text>
          </Animated.View>
        )}
      </View>

      {/* Active power-up indicator */}
      {activePowerUp && (
        <Animated.View entering={SlideInRight.duration(300)} style={[hudStyles.powerUpBar, { borderColor: activePowerUp.color }]}>
          <Text style={hudStyles.powerUpEmoji}>{activePowerUp.emoji}</Text>
          <Text style={[hudStyles.powerUpName, { color: activePowerUp.color }]}>{activePowerUp.name}</Text>
          <Text style={hudStyles.powerUpTimer}>{powerUpTimer}s</Text>
        </Animated.View>
      )}

      {/* Boss health bar */}
      {isBossWave && (
        <Animated.View entering={FadeIn} style={hudStyles.bossBar}>
          <Text style={hudStyles.bossLabel}>👹 BOSS</Text>
          <View style={hudStyles.bossHealthBg}>
            <View style={[hudStyles.bossHealthFill, { width: `${bossHealth}%` }]} />
          </View>
          <Text style={hudStyles.bossPercent}>{bossHealth}%</Text>
        </Animated.View>
      )}
    </View>
  );
};

// ============================================================
// WAVE ANNOUNCEMENT
// ============================================================

interface WaveAnnouncementProps {
  wave: number;
  visible: boolean;
}

export const WaveAnnouncement: React.FC<WaveAnnouncementProps> = ({ wave, visible }) => {
  if (!visible) return null;

  const isBoss = wave > 0 && wave % 4 === 0;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={hudStyles.announcement}>
      <Text style={hudStyles.announcementEmoji}>{isBoss ? '👹' : '⚡'}</Text>
      <Text style={[hudStyles.announcementText, { color: isBoss ? '#FF073A' : '#FFD700' }]}>
        {isBoss ? 'BOSS WAVE!' : `WAVE ${wave}`}
      </Text>
      <Text style={hudStyles.announcementSub}>
        {isBoss ? 'Defeat the boss to earn bonus!' : 'Difficulty increased!'}
      </Text>
    </Animated.View>
  );
};

// ============================================================
// STYLES
// ============================================================

const hudStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stat: {
    alignItems: 'center',
    minWidth: 50,
  },
  label: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  waveWarning: {
    backgroundColor: '#FF073A30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waveWarningText: {
    fontSize: 10,
    color: '#FF073A',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  powerUpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    gap: 6,
    alignSelf: 'center',
  },
  powerUpEmoji: {
    fontSize: 14,
  },
  powerUpName: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  powerUpTimer: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bossBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: '#FF073A60',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    gap: 6,
  },
  bossLabel: {
    fontSize: 10,
    color: '#FF073A',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bossHealthBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bossHealthFill: {
    height: '100%',
    backgroundColor: '#FF073A',
    borderRadius: 3,
  },
  bossPercent: {
    fontSize: 9,
    color: '#FF073A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  announcement: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  announcementEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  announcementText: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
  },
  announcementSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
});
