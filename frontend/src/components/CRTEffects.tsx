// BlockQuest Official - CRT Visual Effects
// Ultimate retro terminal aesthetic with 16-bit pixel art
// Optimized for performance
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { CRT_COLORS, CRT_CONFIG } from '../constants/crtTheme';
import { useAccessibilityStore } from '../utils/accessibility';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// CRT SCANLINES - Classic monitor effect
// ============================================
interface ScanlinesProps {
  opacity?: number;
  animated?: boolean;
}

export const CRTScanlines: React.FC<ScanlinesProps> = ({ 
  opacity = CRT_CONFIG.scanlineOpacity,
  animated = true 
}) => {
  const reduceMotion = useAccessibilityStore((state) => state.reduceMotion);
  const scrollY = useSharedValue(0);
  
  // If reduce motion is enabled, don't render
  if (reduceMotion) {
    return null;
  }
  
  useEffect(() => {
    if (animated) {
      scrollY.value = withRepeat(
        withTiming(4, { duration: CRT_CONFIG.scanlineSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value }],
  }));

  const lines = useMemo(() => {
    const lineArray = [];
    for (let i = 0; i < Math.ceil(SCREEN_HEIGHT / 2) + 4; i++) {
      lineArray.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * 2,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#000',
            opacity: opacity,
          }}
        />
      );
    }
    return lineArray;
  }, [opacity]);
  
  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { pointerEvents: 'none' }]}>
      {lines}
    </Animated.View>
  );
};

// ============================================
// CRT GLOW BORDER - Neon hex-style border
// ============================================
interface GlowBorderProps {
  color?: string;
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  hexStyle?: boolean;
}

export const CRTGlowBorder: React.FC<GlowBorderProps> = ({ 
  color = CRT_COLORS.primary, 
  children, 
  style, 
  intensity = 1, 
  hexStyle = false 
}) => {
  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 15px rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, ${glowPulse.value * intensity})`,
    borderColor: color,
  }));

  return (
    <Animated.View
      style={[
        styles.glowBorder,
        hexStyle && styles.hexBorder,
        animatedStyle,
        style,
      ]}
    >
      {hexStyle && (
        <>
          <View style={[styles.hexCorner, styles.hexCornerTL, { borderColor: color }]} />
          <View style={[styles.hexCorner, styles.hexCornerTR, { borderColor: color }]} />
          <View style={[styles.hexCorner, styles.hexCornerBL, { borderColor: color }]} />
          <View style={[styles.hexCorner, styles.hexCornerBR, { borderColor: color }]} />
        </>
      )}
      {children}
    </Animated.View>
  );
};

// ============================================
// PIXEL RAIN - Matrix-style falling characters
// ============================================
interface PixelRainProps {
  count?: number;
  speed?: number;
}

export const PixelRain: React.FC<PixelRainProps> = ({ 
  count = 15,
  speed = 3000 
}) => {
  const reduceMotion = useAccessibilityStore((state) => state.reduceMotion);
  
  // If reduce motion is enabled, don't render
  if (reduceMotion) {
    return null;
  }
  
  const particles = useMemo(() => {
    const chars = '⬡◆▲▼◀▶★●○□■♦♣♠♥₿Ξ';
    return Array(count).fill(0).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: Math.random() * 8 + 10,
      delay: Math.random() * speed,
      duration: speed + Math.random() * 2000,
    }));
  }, [count, speed]);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {particles.map(p => (
        <RainParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

// Rain particle component
interface RainParticleProps {
  x: number;
  char: string;
  size: number;
  delay: number;
  duration: number;
}

const RainParticle: React.FC<RainParticleProps> = ({ x, char, size, delay, duration }) => {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(SCREEN_HEIGHT + 50, { duration, easing: Easing.linear }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500 }),
          withTiming(0.15, { duration: duration - 1000 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: x,
          fontSize: size,
          color: CRT_COLORS.primary,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          textShadow: `0 0 8px ${CRT_COLORS.primaryGlow}`,
        },
        animatedStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  glowBorder: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  hexBorder: {
    borderRadius: 16,
    position: 'relative',
  },
  hexCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 2,
    backgroundColor: CRT_COLORS.bgDark,
  },
  hexCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 8,
  },
  hexCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 8,
  },
  hexCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
  },
  hexCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
  },
});

// ============================================
// CRT FLICKER TEXT - Glowing terminal text
// ============================================
interface FlickerTextProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: any;
  glitch?: boolean;
}

export const CRTFlickerText: React.FC<FlickerTextProps> = ({ 
  children, 
  color = CRT_COLORS.primary, 
  size = 14,
  style,
  glitch = false,
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(0.9, { duration: 50 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          color,
          fontSize: size,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          fontWeight: 'bold',
          textShadow: `0 0 10px ${color}`,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
};

// ============================================
// HEX BADGE - Hexagonal achievement badge
// ============================================
interface HexBadgeProps {
  icon: string;
  color?: string;
  size?: number;
  unlocked?: boolean;
  onPress?: () => void;
  rarity?: string;
  label?: string;
  animated?: boolean;
}

export const HexBadge: React.FC<HexBadgeProps> = ({ 
  icon, 
  color = CRT_COLORS.primary, 
  size = 60,
  unlocked = true,
  onPress 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: unlocked ? CRT_COLORS.bgMedium : CRT_COLORS.bgDark,
          borderRadius: size / 4,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: unlocked ? color : CRT_COLORS.textDim,
          opacity: unlocked ? 1 : 0.5,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
    </Animated.View>
  );
};

// GhostHand - Animated hand tutorial guide
interface GhostHandProps {
  targetX: number;
  targetY: number;
  visible: boolean;
  action?: 'tap' | 'swipe' | 'drag';
}

export const GhostHand: React.FC<GhostHandProps> = ({
  targetX,
  targetY,
  visible,
  action = 'tap',
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: targetX - 20,
          top: targetY,
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 32 }}>👆</Text>
      {action === 'tap' && (
        <Text style={{
          fontSize: 10,
          color: CRT_COLORS.accentGold,
          textAlign: 'center',
          marginTop: 4,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        }}>
          TAP!
        </Text>
      )}
    </Animated.View>
  );
};

export { CRT_COLORS };
