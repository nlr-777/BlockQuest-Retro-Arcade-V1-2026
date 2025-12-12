// BlockQuest Official - Game Header Component
// Shared header for all game screens with retro styling
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '../constants/colors';
import { PixelText } from './PixelText';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  score: number;
  lives?: number;
  level?: number;
  wave?: number;
  distance?: number;
  color?: string;
  livesIcon?: string;
  showBack?: boolean;
  onBack?: () => void;
  extra?: React.ReactNode;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  score,
  lives,
  level,
  wave,
  distance,
  color = COLORS.neonPink,
  livesIcon = '❤️',
  showBack = true,
  onBack,
  extra,
}) => {
  const router = useRouter();
  
  // Pulsing glow animation for score
  const glowOpacity = useSharedValue(0.6);
  
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const scoreGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Section - Title & Score */}
      <View style={styles.centerSection}>
        <View style={styles.titleContainer}>
          <PixelText size="md" color={color} glow style={styles.title}>
            {title}
          </PixelText>
          {subtitle && (
            <PixelText size="xs" color={COLORS.textMuted}>
              {subtitle}
            </PixelText>
          )}
        </View>
        
        <View style={styles.scoreBox}>
          <PixelText size="xs" color={COLORS.textMuted}>SCORE</PixelText>
          <Animated.View style={scoreGlowStyle}>
            <PixelText size="xl" color={COLORS.neonYellow} glow>
              {score.toLocaleString()}
            </PixelText>
          </Animated.View>
        </View>
      </View>

      {/* Right Section - Stats */}
      <View style={styles.rightSection}>
        {lives !== undefined && (
          <View style={styles.statBox}>
            <View style={styles.livesRow}>
              {Array(lives).fill(0).map((_, i) => (
                <PixelText key={i} size="sm">{livesIcon}</PixelText>
              ))}
              {Array(Math.max(0, 3 - lives)).fill(0).map((_, i) => (
                <PixelText key={`empty-${i}`} size="sm" style={styles.emptyLife}>♡</PixelText>
              ))}
            </View>
          </View>
        )}
        
        {level !== undefined && (
          <View style={styles.statBadge}>
            <PixelText size="xs" color={COLORS.textMuted}>LV</PixelText>
            <PixelText size="md" color={COLORS.neonCyan}>{level}</PixelText>
          </View>
        )}
        
        {wave !== undefined && (
          <View style={styles.statBadge}>
            <PixelText size="xs" color={COLORS.textMuted}>WAVE</PixelText>
            <PixelText size="md" color={COLORS.neonCyan}>{wave}</PixelText>
          </View>
        )}
        
        {distance !== undefined && (
          <View style={styles.statBadge}>
            <PixelText size="xs" color={COLORS.textMuted}>DIST</PixelText>
            <PixelText size="sm" color={COLORS.neonCyan}>{distance}m</PixelText>
          </View>
        )}
        
        {extra}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.bgDark,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.neonPink + '40',
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonPink + '40',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    letterSpacing: 2,
  },
  scoreBox: {
    alignItems: 'center',
    marginTop: 2,
  },
  rightSection: {
    width: 80,
    alignItems: 'flex-end',
  },
  statBox: {
    alignItems: 'center',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 2,
  },
  emptyLife: {
    opacity: 0.3,
  },
  statBadge: {
    backgroundColor: COLORS.bgMedium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '40',
    marginTop: 4,
  },
});

export default GameHeader;
