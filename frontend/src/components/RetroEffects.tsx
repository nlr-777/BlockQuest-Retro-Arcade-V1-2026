// Block Quest Official - 80s/90s Retro Visual Effects
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scanlines overlay - classic CRT effect
export const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.15 }) => {
  const lines = [];
  for (let i = 0; i < SCREEN_HEIGHT / 2; i++) {
    lines.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          top: i * 2,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: '#000',
          opacity,
        }}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>{lines}</View>;
};

// Retro Grid Floor (perspective grid like in synthwave)
export const RetroGrid: React.FC<{ color?: string }> = ({ color = COLORS.neonPink }) => {
  const scrollY = useSharedValue(0);

  useEffect(() => {
    scrollY.value = withRepeat(
      withTiming(40, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value }],
  }));

  return (
    <View style={[styles.gridContainer, { pointerEvents: 'none' }]}>
      <Animated.View style={[styles.gridInner, animatedStyle]}>
        <Svg width={SCREEN_WIDTH} height={200}>
          <Defs>
            <LinearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0" />
              <Stop offset="0.5" stopColor={color} stopOpacity="0.8" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Horizontal lines */}
          {Array(10).fill(0).map((_, i) => (
            <Line
              key={`h${i}`}
              x1="0"
              y1={i * 20}
              x2={SCREEN_WIDTH}
              y2={i * 20}
              stroke="url(#gridFade)"
              strokeWidth="1"
            />
          ))}
          {/* Vertical lines with perspective */}
          {Array(15).fill(0).map((_, i) => {
            const x = (i - 7) * (SCREEN_WIDTH / 14) + SCREEN_WIDTH / 2;
            return (
              <Line
                key={`v${i}`}
                x1={SCREEN_WIDTH / 2}
                y1="0"
                x2={x}
                y2="200"
                stroke={color}
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
};

// Neon Glow Box
export const NeonBox: React.FC<{
  color?: string;
  children: React.ReactNode;
  style?: any;
  intensity?: number;
}> = ({ color = COLORS.neonPink, children, style, intensity = 1 }) => {
  const glowPulse = useSharedValue(0.6);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 15px rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, ${glowPulse.value * intensity})`,
  }));

  return (
    <Animated.View
      style={[
        styles.neonBox,
        {
          borderColor: color,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Chromatic Aberration Text Effect (offset RGB)
export const ChromaticText: React.FC<{
  children: string;
  style?: any;
  offset?: number;
}> = ({ children, style, offset = 2 }) => {
  return (
    <View style={styles.chromaticContainer}>
      <Animated.Text style={[style, styles.chromaticRed, { left: -offset }]}>
        {children}
      </Animated.Text>
      <Animated.Text style={[style, styles.chromaticBlue, { left: offset }]}>
        {children}
      </Animated.Text>
      <Animated.Text style={[style, styles.chromaticMain]}>
        {children}
      </Animated.Text>
    </View>
  );
};

// Flickering Neon Sign Effect
export const FlickerText: React.FC<{
  children: React.ReactNode;
  style?: any;
  color?: string;
}> = ({ children, style, color = COLORS.neonPink }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const flicker = () => {
      opacity.value = withSequence(
        withTiming(0.3, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { duration: 50 }),
      );
    };
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) flicker();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Starfield Background
export const Starfield: React.FC<{ count?: number }> = ({ count = 50 }) => {
  const stars = Array(count).fill(0).map((_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 2000,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {stars.map(star => (
        <StarParticle key={star.id} {...star} />
      ))}
    </View>
  );
};

const StarParticle: React.FC<{ x: number; y: number; size: number; delay: number }> = ({
  x, y, size, delay
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
          backgroundColor: '#FFF',
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Sun/Moon for synthwave horizon
export const SynthwaveSun: React.FC<{ size?: number }> = ({ size = 100 }) => {
  const glowPulse = useSharedValue(0.5);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 50px rgba(255, 106, 213, ${glowPulse.value})`,
    transform: [{ scale: 0.95 + glowPulse.value * 0.1 }],
  }));

  return (
    <View style={styles.sunContainer}>
      <Animated.View
        style={[
          styles.sun,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      >
        {/* Horizontal stripes through sun */}
        {Array(5).fill(0).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: 20 + i * 15,
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: COLORS.bgDark,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    overflow: 'hidden',
    transform: [{ perspective: 200 }, { rotateX: '60deg' }],
  },
  gridInner: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  neonBox: {
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  chromaticContainer: {
    position: 'relative',
  },
  chromaticRed: {
    position: 'absolute',
    color: 'rgba(255, 0, 0, 0.5)',
  },
  chromaticBlue: {
    position: 'absolute',
    color: 'rgba(0, 0, 255, 0.5)',
  },
  chromaticMain: {
    color: '#FFF',
  },
  sunContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  sun: {
    backgroundColor: '#FF6AD5',
    shadowColor: '#FF6AD5',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 50,
    overflow: 'hidden',
  },
});

export default {
  Scanlines,
  RetroGrid,
  NeonBox,
  ChromaticText,
  FlickerText,
  Starfield,
  SynthwaveSun,
};
