// BlockQuest Official - CHAOS MODE Visual Effects
// The "holy shit I want to play that" effects library
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// RAINBOW PULSE BORDER - For legendary items
// ============================================
export const RainbowPulseBorder: React.FC<{
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  speed?: number;
}> = ({ children, style, intensity = 1, speed = 2000 }) => {
  const colorProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    colorProgress.value = withRepeat(
      withTiming(1, { duration: speed, easing: Easing.linear }),
      -1,
      false
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      ['#FF0080', '#FF8000', '#FFD700', '#00FF88', '#00D4FF', '#FF0080']
    );
    return {
      borderColor,
      transform: [{ scale: pulseScale.value }],
      shadowColor: borderColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8 * intensity,
      shadowRadius: 15,
    };
  });

  return (
    <Animated.View style={[styles.rainbowBorder, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// FLOATING SPARKLES - Ambient magic particles
// ============================================
export const FloatingSparkles: React.FC<{ 
  count?: number; 
  colors?: string[];
  area?: { width: number; height: number };
}> = ({ 
  count = 20, 
  colors = ['#FFD700', '#00FF88', '#FF00FF', '#00D4FF'],
  area 
}) => {
  const sparkles = Array(count).fill(0).map((_, i) => ({
    id: i,
    x: Math.random() * (area?.width || SCREEN_WIDTH),
    y: Math.random() * (area?.height || SCREEN_HEIGHT),
    size: 2 + Math.random() * 4,
    color: colors[i % colors.length],
    delay: Math.random() * 3000,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {sparkles.map(s => (
        <Sparkle key={s.id} {...s} />
      ))}
    </View>
  );
};

const Sparkle: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}> = ({ x, y, size, color, delay }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.3, { duration: 1000 }),
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
          -1,
          false
        )
      );
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withSpring(1.5),
            withSpring(0.8),
            withSpring(1.2),
            withSpring(0)
          ),
          -1,
          false
        )
      );
      translateY.value = withDelay(
        delay,
        withRepeat(
          withTiming(-30, { duration: 2500 }),
          -1,
          false
        )
      );
    };
    startAnimation();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// MEGA CONFETTI - Victory celebration explosion
// ============================================
export const MegaConfetti: React.FC<{ 
  active: boolean;
  onComplete?: () => void;
}> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array(80).fill(0).map((_, i) => ({
        id: i,
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT / 3,
        color: [
          '#FF0080', '#FFD700', '#00FF88', '#00D4FF', 
          '#FF00FF', '#FF8000', '#FFFFFF', '#00FFFF'
        ][i % 8],
        shape: ['square', 'circle', 'star'][i % 3],
        size: 6 + Math.random() * 8,
      }));
      setParticles(newParticles);
      
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 1000 }]}>
      {particles.map(p => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

const ConfettiParticle: React.FC<{
  x: number;
  y: number;
  color: string;
  shape: string;
  size: number;
}> = ({ x, y, color, shape, size }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 300;
    const endX = Math.cos(angle) * velocity;
    const endY = Math.sin(angle) * velocity - 100; // Bias upward initially

    scale.value = withSpring(1);
    translateX.value = withTiming(endX, { duration: 2000, easing: Easing.out(Easing.cubic) });
    translateY.value = withSequence(
      withTiming(endY, { duration: 800, easing: Easing.out(Easing.cubic) }),
      withTiming(SCREEN_HEIGHT, { duration: 1200, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 300 + Math.random() * 500 }),
      -1,
      false
    );
    opacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x + translateX.value },
      { translateY: y + translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapeStyle = shape === 'circle' 
    ? { borderRadius: size / 2 }
    : shape === 'star'
    ? { borderRadius: 2 }
    : {};

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          ...shapeStyle,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// PRESS EXPLOSION - Tap feedback particles
// ============================================
export const PressExplosion: React.FC<{
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}> = ({ x, y, color = CRT_COLORS.primary, onComplete }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array(16).fill(0).map((_, i) => ({
      id: i,
      angle: (i / 16) * Math.PI * 2,
      distance: 40 + Math.random() * 40,
      size: 3 + Math.random() * 5,
    }));
    setParticles(newParticles);
    
    setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 600);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Central flash */}
      <CentralFlash x={x} y={y} color={color} />
      {/* Particles */}
      {particles.map(p => (
        <ExplosionParticle key={p.id} x={x} y={y} color={color} {...p} />
      ))}
    </View>
  );
};

const CentralFlash: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(2, { damping: 8 }),
      withTiming(3, { duration: 200 })
    );
    opacity.value = withTiming(0, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - 15,
          top: y - 15,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const ExplosionParticle: React.FC<{
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
}> = ({ x, y, angle, distance, size, color }) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(200, withTiming(0, { duration: 200 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const dx = Math.cos(angle) * distance * progress.value;
    const dy = Math.sin(angle) * distance * progress.value;
    return {
      transform: [
        { translateX: x + dx - size / 2 },
        { translateY: y + dy - size / 2 },
        { scale: 1 - progress.value * 0.5 },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// GLOW CARD - Animated glowing card wrapper
// ============================================
export const GlowCard: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: any;
  intensity?: number;
  onPress?: () => void;
}> = ({ children, color = CRT_COLORS.primary, style, intensity = 1 }) => {
  const glowOpacity = useSharedValue(0.3);
  const borderGlow = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6 * intensity, { duration: 1500 }),
        withTiming(0.3 * intensity, { duration: 1500 })
      ),
      -1,
      true
    );
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    borderColor: `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, ${borderGlow.value})`,
  }));

  return (
    <Animated.View
      style={[
        styles.glowCard,
        {
          shadowColor: color,
          borderColor: color,
        },
        animatedStyle,
        style,
      ]}
    >
      {/* Top glow accent */}
      <View style={[styles.glowAccent, { backgroundColor: color }]} />
      {children}
    </Animated.View>
  );
};

// ============================================
// BOUNCY PRESS - Satisfying press animation
// ============================================
export const BouncyPress: React.FC<{
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  bounceScale?: number;
}> = ({ children, style, onPress, bounceScale = 0.95 }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(bounceScale, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {React.cloneElement(children as React.ReactElement, {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
      })}
    </Animated.View>
  );
};

// ============================================
// NUMBER COUNTER - Animated counting numbers
// ============================================
export const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  color?: string;
  size?: number;
  prefix?: string;
  suffix?: string;
}> = ({ value, duration = 1000, color = CRT_COLORS.primary, size = 24, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration }, () => {
      runOnJS(setDisplayValue)(value);
    });
    
    // Update display during animation
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(animatedValue.value));
    }, 16);
    
    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text style={[styles.animatedNumber, { color, fontSize: size }]}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </Text>
  );
};

// ============================================
// HOLOGRAPHIC SHINE - Card shine effect
// ============================================
export const HolographicShine: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const shinePosition = useSharedValue(-100);

  useEffect(() => {
    shinePosition.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(200, { duration: 800, easing: Easing.inOut(Easing.ease) })),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shinePosition.value }],
  }));

  return (
    <View style={[styles.holographicContainer, style]}>
      {children}
      <Animated.View style={[styles.holographicShine, shineStyle]} />
    </View>
  );
};

// ============================================
// ENERGY BARS - Animated power bars
// ============================================
export const EnergyBar: React.FC<{
  progress: number; // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
  showGlow?: boolean;
}> = ({ progress, color = CRT_COLORS.primary, height = 8, animated = true, showGlow = true }) => {
  const width = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    width.value = animated 
      ? withSpring(progress, { damping: 15 })
      : progress;
    
    if (showGlow) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [progress, animated]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.energyBarContainer, { height }]}>
      <Animated.View style={[styles.energyBarFill, { backgroundColor: color, height }, barStyle]}>
        {showGlow && (
          <Animated.View 
            style={[
              styles.energyBarGlow, 
              { backgroundColor: color },
              glowStyle
            ]} 
          />
        )}
      </Animated.View>
    </View>
  );
};

// ============================================
// FLOATING EMOJI - Reaction animations
// ============================================
export const FloatingEmoji: React.FC<{
  emoji: string;
  x: number;
  y: number;
  onComplete?: () => void;
}> = ({ emoji, x, y, onComplete }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 8 });
    translateY.value = withTiming(-100, { duration: 1500, easing: Easing.out(Easing.cubic) });
    rotate.value = withSequence(
      withTiming(-15, { duration: 200 }),
      withTiming(15, { duration: 400 }),
      withTiming(0, { duration: 200 })
    );
    opacity.value = withDelay(1000, withTiming(0, { duration: 500 }));
    
    setTimeout(() => onComplete?.(), 1500);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: x - 20,
          top: y - 20,
          fontSize: 40,
        },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

// ============================================
// PULSE RING - Ripple effect
// ============================================
export const PulseRing: React.FC<{
  x: number;
  y: number;
  color?: string;
  size?: number;
}> = ({ x, y, color = CRT_COLORS.primary, size = 100 }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  rainbowBorder: {
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    overflow: 'hidden',
  },
  glowCard: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  glowAccent: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    opacity: 0.6,
  },
  animatedNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  holographicContainer: {
    overflow: 'hidden',
  },
  holographicShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  energyBarContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyBarFill: {
    borderRadius: 4,
    position: 'relative',
  },
  energyBarGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    borderRadius: 4,
  },
});

export default {
  RainbowPulseBorder,
  FloatingSparkles,
  MegaConfetti,
  PressExplosion,
  GlowCard,
  BouncyPress,
  AnimatedNumber,
  HolographicShine,
  EnergyBar,
  FloatingEmoji,
  PulseRing,
};
