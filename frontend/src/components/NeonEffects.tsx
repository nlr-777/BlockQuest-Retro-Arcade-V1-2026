// NeonEffects.tsx - Arcade-style neon visual effects
// Scanlines, glow borders, animated neon backgrounds, and retro effects
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scanline overlay for CRT retro feel
export const ScanlineOverlay: React.FC<{
  opacity?: number;
  color?: string;
  spacing?: number;
}> = ({ opacity = 0.06, color = '#000000', spacing = 3 }) => {
  const lines = Math.ceil(SCREEN_HEIGHT / spacing);
  
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * spacing,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: color,
            opacity: i % 2 === 0 ? opacity : 0,
          }}
        />
      ))}
    </View>
  );
};

// Animated neon border that pulses
export const NeonBorder: React.FC<{
  color?: string;
  width?: number;
  radius?: number;
  pulseSpeed?: number;
  children?: React.ReactNode;
  style?: any;
}> = ({ color = '#00FF41', width = 2, radius = 12, pulseSpeed = 2000, children, style }) => {
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: pulseSpeed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: pulseSpeed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseSpeed]);
  
  return (
    <Animated.View style={[
      {
        borderWidth: width,
        borderColor: color,
        borderRadius: radius,
        opacity: glowAnim,
      },
      style,
    ]}>
      {children}
    </Animated.View>
  );
};

// Floating neon particles background
export const NeonParticles: React.FC<{
  count?: number;
  colors?: string[];
  speed?: number;
}> = ({ count = 20, colors = ['#9D4EDD', '#00CED1', '#FF7F50', '#32CD32', '#FFD700'], speed = 3000 }) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 4,
      color: colors[i % colors.length],
      anim: new Animated.Value(0),
      delay: Math.random() * 2000,
    }))
  ).current;
  
  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, {
            toValue: 1,
            duration: speed + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: speed + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);
  
  return (
    <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.anim,
          }}
        />
      ))}
    </View>
  );
};

// Arcade cabinet frame effect
export const ArcadeCabinetFrame: React.FC<{
  color?: string;
  children: React.ReactNode;
  style?: any;
}> = ({ color = '#1A0A42', children, style }) => {
  return (
    <View style={[styles.cabinetOuter, { backgroundColor: color }, style]}>
      <View style={styles.cabinetScreen}>
        {children}
      </View>
      {/* Screws/rivets decoration */}
      <View style={[styles.rivet, { top: 6, left: 6, backgroundColor: color === '#1A0A42' ? '#333' : '#555' }]} />
      <View style={[styles.rivet, { top: 6, right: 6, backgroundColor: color === '#1A0A42' ? '#333' : '#555' }]} />
      <View style={[styles.rivet, { bottom: 6, left: 6, backgroundColor: color === '#1A0A42' ? '#333' : '#555' }]} />
      <View style={[styles.rivet, { bottom: 6, right: 6, backgroundColor: color === '#1A0A42' ? '#333' : '#555' }]} />
    </View>
  );
};

// Animated neon text glow wrapper
export const NeonGlow: React.FC<{
  color: string;
  intensity?: number;
  pulseSpeed?: number;
  children: React.ReactNode;
  style?: any;
}> = ({ color, intensity = 0.8, pulseSpeed = 1500, children, style }) => {
  const glowAnim = useRef(new Animated.Value(intensity * 0.5)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: intensity,
          duration: pulseSpeed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: intensity * 0.3,
          duration: pulseSpeed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [intensity, pulseSpeed]);
  
  return (
    <Animated.View style={[{ opacity: glowAnim }, style]}>
      {children}
    </Animated.View>
  );
};

// Pixel grid background pattern
export const PixelGridBackground: React.FC<{
  color?: string;
  gridSize?: number;
  opacity?: number;
}> = ({ color = '#1A0A42', gridSize = 24, opacity = 0.15 }) => {
  const cols = Math.ceil(SCREEN_WIDTH / gridSize);
  const rows = Math.ceil(SCREEN_HEIGHT / gridSize);
  
  return (
    <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: cols }, (_, col) => (
            <View
              key={col}
              style={{
                width: gridSize,
                height: gridSize,
                borderWidth: 0.5,
                borderColor: color,
                opacity: opacity,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Boss warning flash effect
export const BossWarningFlash: React.FC<{
  visible: boolean;
  color?: string;
}> = ({ visible, color = '#FF0040' }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 4 }
      ).start();
    } else {
      flashAnim.setValue(0);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color, opacity: flashAnim },
      ]}
      pointerEvents="none"
    />
  );
};

// Power-up collection flash
export const PowerUpFlash: React.FC<{
  visible: boolean;
  color?: string;
}> = ({ visible, color = '#FFD700' }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.4,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color, opacity: flashAnim },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  cabinetOuter: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 3,
    borderColor: '#333',
  },
  cabinetScreen: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#0A0A1A',
  },
  rivet: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default {
  ScanlineOverlay,
  NeonBorder,
  NeonParticles,
  ArcadeCabinetFrame,
  NeonGlow,
  PixelGridBackground,
  BossWarningFlash,
  PowerUpFlash,
};
