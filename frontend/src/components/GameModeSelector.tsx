// Shared Game Mode Selector + Level Theme System
// Used across all arcade games for consistent mode selection and level visuals

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { PixelCharacter, PixelPortrait } from './PixelCharacter';
import { NeonParticles } from './NeonEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// LEVEL THEME SYSTEM
// ============================================================

export interface LevelTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  glow: string;
  emoji: string;
}

export const LEVEL_THEMES: LevelTheme[] = [
  { name: 'Genesis',    primary: '#39FF14', secondary: '#00FFFF', accent: '#00FF88', bg: '#001A0A', glow: 'rgba(57,255,20,0.3)',   emoji: '🌱' },
  { name: 'Circuit',    primary: '#00BFFF', secondary: '#6366F1', accent: '#00FFFF', bg: '#000A1A', glow: 'rgba(0,191,255,0.3)',   emoji: '⚡' },
  { name: 'Plasma',     primary: '#BF00FF', secondary: '#FF00FF', accent: '#FF6AD5', bg: '#0D0221', glow: 'rgba(191,0,255,0.3)',   emoji: '🔮' },
  { name: 'Inferno',    primary: '#FF6600', secondary: '#FF073A', accent: '#FFFF00', bg: '#1A0800', glow: 'rgba(255,102,0,0.3)',   emoji: '🔥' },
  { name: 'Quantum',    primary: '#FFD700', secondary: '#FF00FF', accent: '#00FFFF', bg: '#0D0221', glow: 'rgba(255,215,0,0.3)',   emoji: '✨' },
  { name: 'Nebula',     primary: '#FF6AD5', secondary: '#8B5CF6', accent: '#06B6D4', bg: '#0F0520', glow: 'rgba(255,106,213,0.3)', emoji: '🌌' },
  { name: 'Void',       primary: '#FFFFFF', secondary: '#FF073A', accent: '#39FF14', bg: '#050505', glow: 'rgba(255,255,255,0.2)', emoji: '🕳️' },
  { name: 'Hyperdrive', primary: '#00FFFF', secondary: '#FFD700', accent: '#FF00FF', bg: '#000D1A', glow: 'rgba(0,255,255,0.3)',   emoji: '🚀' },
];

export function getLevelTheme(level: number): LevelTheme {
  return LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length];
}

// For survival mode: smoothly interpolate theme based on score/time
export function getSurvivalTheme(score: number): LevelTheme {
  const themeIndex = Math.floor(score / 500) % LEVEL_THEMES.length;
  return LEVEL_THEMES[themeIndex];
}

// ============================================================
// GAME MODE TYPE
// ============================================================

export type GameMode = 'classic' | 'survival';

// ============================================================
// GAME MODE SELECTOR COMPONENT
// ============================================================

interface GameModeSelectorProps {
  gameTitle: string;
  gameEmoji: string;
  gameColor: string;
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
  highScores?: { classic: number; survival: number };
  characterId?: string;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  gameTitle,
  gameEmoji,
  gameColor,
  onSelectMode,
  onBack,
  highScores,
  characterId,
}) => {
  // Pulsing glow animation
  const glowAnim = useSharedValue(0.5);

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { backgroundColor: gameColor }, glowStyle]} />
      
      {/* Neon particle effects */}
      <NeonParticles count={15} colors={[gameColor, '#FFFFFF', gameColor + '80']} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      {/* Title area with pixel character */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.titleArea}>
        <View style={styles.titleRow}>
          {characterId && (
            <View style={styles.pixelCharWrapper}>
              <PixelCharacter characterId={characterId} size={2} animate={true} glowColor={gameColor} />
            </View>
          )}
          <View style={styles.titleTextArea}>
            <Text style={styles.emoji}>{gameEmoji}</Text>
            <Text style={[styles.title, { textShadow: `0 0 20px ${gameColor}` }]}>
              {gameTitle}
            </Text>
          </View>
          {characterId && (
            <View style={styles.pixelCharWrapper}>
              <PixelCharacter characterId={characterId} size={2} animate={true} glowColor={gameColor} />
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>SELECT MODE</Text>
      </Animated.View>

      {/* Mode buttons */}
      <View style={styles.modesContainer}>
        {/* Classic Mode */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <TouchableOpacity
            style={[styles.modeCard, { borderColor: '#39FF14' }]}
            onPress={() => onSelectMode('classic')}
            activeOpacity={0.7}
          >
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>🏆</Text>
              <Text style={[styles.modeTitle, { color: '#39FF14' }]}>CLASSIC</Text>
            </View>
            <Text style={styles.modeDesc}>
              Progress through {LEVEL_THEMES.length} themed levels with increasing difficulty. Complete all levels to master the game!
            </Text>
            <View style={styles.modeFeatures}>
              <Text style={styles.featureTag}>📈 Progressive Levels</Text>
              <Text style={styles.featureTag}>🎯 Level Goals</Text>
              <Text style={styles.featureTag}>🏅 Level Bonuses</Text>
            </View>
            {highScores && highScores.classic > 0 && (
              <Text style={[styles.highScore, { color: '#39FF14' }]}>
                BEST: {highScores.classic.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Survival Mode */}
        <Animated.View entering={FadeInUp.delay(450).duration(400)}>
          <TouchableOpacity
            style={[styles.modeCard, { borderColor: '#FF073A' }]}
            onPress={() => onSelectMode('survival')}
            activeOpacity={0.7}
          >
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>💀</Text>
              <Text style={[styles.modeTitle, { color: '#FF073A' }]}>SURVIVAL</Text>
            </View>
            <Text style={styles.modeDesc}>
              Endless play with ever-increasing difficulty. Boss waves, power-ups, and score multipliers!
            </Text>
            <View style={styles.modeFeatures}>
              <Text style={styles.featureTag}>♾️ Endless Waves</Text>
              <Text style={styles.featureTag}>👾 Boss Battles</Text>
              <Text style={styles.featureTag}>⚡ Power-Ups</Text>
              <Text style={styles.featureTag}>🔥 Score x5</Text>
            </View>
            {highScores && highScores.survival > 0 && (
              <Text style={[styles.highScore, { color: '#FF073A' }]}>
                BEST: {highScores.survival.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================================
// LEVEL TRANSITION COMPONENT
// ============================================================

interface LevelTransitionProps {
  level: number;
  visible: boolean;
  onComplete: () => void;
}

export const LevelTransition: React.FC<LevelTransitionProps> = ({ level, visible, onComplete }) => {
  const theme = getLevelTheme(level);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, 2000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.transitionOverlay}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.transitionContent}>
        <Text style={styles.transitionEmoji}>{theme.emoji}</Text>
        <Text style={[styles.transitionLevel, { color: theme.primary, textShadow: `0 0 30px ${theme.primary}` }]}>
          LEVEL {level}
        </Text>
        <Text style={[styles.transitionName, { color: theme.secondary }]}>
          {theme.name.toUpperCase()}
        </Text>
        <View style={[styles.transitionBar, { backgroundColor: theme.primary + '30' }]}>
          <Animated.View
            entering={FadeIn.delay(200)}
            style={[styles.transitionBarFill, { backgroundColor: theme.primary }]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================================
// SURVIVAL HUD COMPONENT
// ============================================================

interface SurvivalHUDProps {
  timeAlive: number;
  multiplier: number;
  color: string;
}

export const SurvivalHUD: React.FC<SurvivalHUDProps> = ({ timeAlive, multiplier, color }) => {
  const mins = Math.floor(timeAlive / 60);
  const secs = timeAlive % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.survivalHud}>
      <View style={styles.survivalStat}>
        <Text style={styles.survivalLabel}>TIME</Text>
        <Text style={[styles.survivalValue, { color }]}>{timeStr}</Text>
      </View>
      <View style={styles.survivalStat}>
        <Text style={styles.survivalLabel}>MULTI</Text>
        <Text style={[styles.survivalValue, { color: multiplier >= 3 ? '#FF073A' : multiplier >= 2 ? '#FF6600' : color }]}>
          x{multiplier.toFixed(1)}
        </Text>
      </View>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bgGlow: {
    position: 'absolute',
    top: '20%',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    opacity: 0.15,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  titleTextArea: {
    alignItems: 'center',
  },
  pixelCharWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 6,
    marginTop: 8,
  },
  modesContainer: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  modeCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modeIcon: {
    fontSize: 28,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
  },
  modeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
    marginBottom: 12,
  },
  modeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highScore: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 10,
    textAlign: 'right',
  },
  // Level Transition
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  transitionContent: {
    alignItems: 'center',
  },
  transitionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  transitionLevel: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 6,
  },
  transitionName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
    marginTop: 4,
    marginBottom: 24,
  },
  transitionBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  transitionBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  // Survival HUD
  survivalHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  survivalStat: {
    alignItems: 'center',
  },
  survivalLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  survivalValue: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
