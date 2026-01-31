// BlockQuest Official - XP Progress Bar Component
// Prominent CRT-styled XP tracker with flicker effect
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { PixelText } from './PixelText';
import { CRT_COLORS } from '../constants/crtTheme';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  xpPerLevel?: number;
  showFlicker?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  level,
  xpPerLevel = 100,
  showFlicker = true,
}) => {
  // Calculate progress within current level
  const xpInCurrentLevel = currentXP % xpPerLevel;
  const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100;
  const xpToNextLevel = xpPerLevel - xpInCurrentLevel;

  // CRT flicker animation
  const flicker = useSharedValue(1);
  const scanline = useSharedValue(0);

  useEffect(() => {
    if (showFlicker) {
      // Subtle flicker effect
      flicker.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 50 }),
          withTiming(1, { duration: 50 }),
          withTiming(0.98, { duration: 100 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );

      // Scanline sweep
      scanline.value = withRepeat(
        withTiming(100, { duration: 3000, easing: Easing.linear }),
        -1
      );
    }
  }, [showFlicker]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: flicker.value,
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    top: `${scanline.value}%`,
  }));

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    progressWidth.value = withTiming(progressPercent, { duration: 500 });
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Scanline effect */}
      {showFlicker && (
        <Animated.View style={[styles.scanline, scanlineStyle, { pointerEvents: 'none' }]} />
      )}

      {/* Level Badge */}
      <View style={styles.levelBadge}>
        <PixelText size="xs" color={CRT_COLORS.bgDark}>LV</PixelText>
        <PixelText size="lg" color={CRT_COLORS.bgDark} style={styles.levelNumber}>
          {level}
        </PixelText>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        {/* XP Label */}
        <View style={styles.xpHeader}>
          <PixelText size="xs" color={CRT_COLORS.neonGreen} glow>
            ⚡ XP PROGRESS
          </PixelText>
          <PixelText size="xs" color={CRT_COLORS.textMuted}>
            {xpInCurrentLevel}/{xpPerLevel}
          </PixelText>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, progressStyle]}>
            {/* Glow effect */}
            <View style={styles.progressGlow} />
          </Animated.View>
          
          {/* Tick marks */}
          {[25, 50, 75].map((tick) => (
            <View key={tick} style={[styles.tickMark, { left: `${tick}%` }]} />
          ))}
        </View>

        {/* Next Level Info */}
        <View style={styles.nextLevelInfo}>
          <PixelText size="xs" color={CRT_COLORS.textDim}>
            {xpToNextLevel} XP to Level {level + 1}
          </PixelText>
          {level >= 5 && (
            <PixelText size="xs" color={CRT_COLORS.chainGold}>
              🏅 Badge Eligible!
            </PixelText>
          )}
        </View>
      </View>

      {/* Total XP */}
      <View style={styles.totalXP}>
        <PixelText size="xl" color={CRT_COLORS.neonGreen} glow>
          {currentXP}
        </PixelText>
        <PixelText size="xs" color={CRT_COLORS.textMuted}>TOTAL</PixelText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.neonGreen + '60',
    overflow: 'hidden',
    // CRT glow effect - web compatible
    boxShadow: `0 0 10px ${CRT_COLORS.neonGreen}4D`,
    elevation: 5,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: CRT_COLORS.neonGreen + '20',
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CRT_COLORS.neonGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // Glow - web compatible
    boxShadow: `0 0 8px ${CRT_COLORS.neonGreen}CC`,
  },
  levelNumber: {
    marginTop: -4,
  },
  progressSection: {
    flex: 1,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CRT_COLORS.neonGreen + '40',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.neonGreen,
    borderRadius: 5,
    position: 'relative',
  },
  progressGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CRT_COLORS.neonGreen,
    opacity: 0.5,
    // Blur effect for glow
    ...(Platform.OS === 'web' ? { filter: 'blur(4px)' } : {}),
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: CRT_COLORS.textDim + '40',
  },
  nextLevelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalXP: {
    alignItems: 'center',
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: CRT_COLORS.neonGreen + '40',
  },
});

export default XPProgressBar;
