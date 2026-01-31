// BlockQuest Official - CRT Visual Effects
// Ultimate retro terminal aesthetic with 16-bit pixel art
// Now respects accessibility settings (reduceMotion)
import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { CRT_COLORS, CRT_CONFIG } from '../constants/crtTheme';
import { useAccessibilityStore } from '../utils/accessibility';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// CRT SCANLINES - Classic monitor effect
// ============================================
export const CRTScanlines: React.FC<{ opacity?: number; animated?: boolean }> = ({ 
  opacity = CRT_CONFIG.scanlineOpacity,
  animated = true 
}) => {
  const { reduceMotion } = useAccessibilityStore();
  const scrollY = useSharedValue(0);
  
  // If reduce motion is enabled, don't render scanlines at all
  if (reduceMotion) {
    return null;
  }
  
  useEffect(() => {
    if (animated && !reduceMotion) {
      scrollY.value = withRepeat(
        withTiming(4, { duration: CRT_CONFIG.scanlineSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value }],
  }));

  const lines = [];
  for (let i = 0; i < Math.ceil(SCREEN_HEIGHT / 2) + 4; i++) {
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
          opacity: opacity,
        }}
      />
    );
  }
  
  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { pointerEvents: 'none' }]}>
      {lines}
    </Animated.View>
  );
};

// ============================================
// CRT GLOW BORDER - Neon hex-style border
// ============================================
export const CRTGlowBorder: React.FC<{
  color?: string;
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  hexStyle?: boolean;
}> = ({ color = CRT_COLORS.primary, children, style, intensity = 1, hexStyle = false }) => {
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
      {/* Corner hex decorations */}
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
export const PixelRain: React.FC<{ count?: number; speed?: number }> = ({ 
  count = 20,
  speed = 3000 
}) => {
  const chars = '⬡◆▲▼◀▶★●○□■♦♣♠♥₿Ξ';
  const particles = Array(count).fill(0).map((_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    char: chars[Math.floor(Math.random() * chars.length)],
    size: Math.random() * 8 + 10,
    delay: Math.random() * speed,
    duration: speed + Math.random() * 2000,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {particles.map(p => (
        <RainParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

const RainParticle: React.FC<{
  x: number;
  char: string;
  size: number;
  delay: number;
  duration: number;
}> = ({ x, char, size, delay, duration }) => {
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
          withTiming(0.6, { duration: 500 }),
          withTiming(0.2, { duration: duration - 1000 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);

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
// PARTICLE BURST - Explosion effect
// ============================================
export const ParticleBurst: React.FC<{
  x: number;
  y: number;
  count?: number;
  color?: string;
  onComplete?: () => void;
}> = ({ x, y, count = 12, color = CRT_COLORS.primary, onComplete }) => {
  const particles = Array(count).fill(0).map((_, i) => ({
    id: i,
    angle: (i / count) * Math.PI * 2,
    distance: 50 + Math.random() * 50,
    size: 4 + Math.random() * 6,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {particles.map(p => (
        <BurstParticle key={p.id} x={x} y={y} {...p} color={color} />
      ))}
    </View>
  );
};

const BurstParticle: React.FC<{
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
    progress.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 600 });
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
          boxShadow: `0 0 4px ${color}CC`,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// CONFETTI BURST - Victory celebration
// ============================================
export const ConfettiBurst: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  
  const confetti = Array(50).fill(0).map((_, i) => ({
    id: i,
    x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100,
    color: [
      CRT_COLORS.primary,
      CRT_COLORS.accentCyan,
      CRT_COLORS.accentMagenta,
      CRT_COLORS.accentGold,
    ][i % 4],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {confetti.map(c => (
        <ConfettiPiece key={c.id} startX={c.x} color={c.color} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ startX: number; color: string }> = ({ startX, color }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const endX = (Math.random() - 0.5) * SCREEN_WIDTH;
    translateY.value = withTiming(SCREEN_HEIGHT + 50, { duration: 2000 + Math.random() * 1000 });
    translateX.value = withTiming(endX, { duration: 2000 + Math.random() * 1000 });
    rotate.value = withRepeat(withTiming(360, { duration: 500 }), -1, false);
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 2500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// SCREEN SHAKE - Impact effect
// ============================================
export const ScreenShake: React.FC<{ 
  children: React.ReactNode;
  active: boolean;
  intensity?: number;
}> = ({ children, active, intensity = 10 }) => {
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  useEffect(() => {
    if (active) {
      shakeX.value = withSequence(
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(intensity * 0.5, { duration: 50 }),
        withTiming(-intensity * 0.5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      shakeY.value = withSequence(
        withTiming(-intensity * 0.5, { duration: 50 }),
        withTiming(intensity * 0.5, { duration: 50 }),
        withTiming(-intensity * 0.3, { duration: 50 }),
        withTiming(intensity * 0.3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// GHOST HAND - Tutorial guide
// ============================================
export const GhostHand: React.FC<{
  targetX: number;
  targetY: number;
  visible: boolean;
  action?: 'tap' | 'swipe' | 'hold';
}> = ({ targetX, targetY, visible, action = 'tap' }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.4, { duration: 500 })
        ),
        -1,
        true
      );
      
      if (action === 'tap') {
        scale.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          true
        );
      } else if (action === 'swipe') {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-30, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
          -1,
          true
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, action]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: targetX - 20 },
      { translateY: targetY - 20 + translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.ghostHand, animatedStyle, { pointerEvents: 'none' }]}>
      <Text style={styles.ghostHandIcon}>👆</Text>
      {action === 'tap' && (
        <View style={styles.tapRing} />
      )}
    </Animated.View>
  );
};

// ============================================
// HEX BADGE - NFT style badge
// ============================================
export const HexBadge: React.FC<{
  size?: number;
  color?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  label?: string;
  animated?: boolean;
}> = ({ 
  size = 80, 
  color,
  rarity = 'common', 
  icon = '⬡',
  label,
  animated = true 
}) => {
  const rarityColors = {
    common: CRT_COLORS.rarityCommon,
    uncommon: CRT_COLORS.rarityUncommon,
    rare: CRT_COLORS.rarityRare,
    epic: CRT_COLORS.rarityEpic,
    legendary: CRT_COLORS.rarityLegendary,
  };
  
  const badgeColor = color || rarityColors[rarity];
  const glow = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
      
      if (rarity === 'legendary') {
        rotate.value = withRepeat(
          withTiming(360, { duration: 8000, easing: Easing.linear }),
          -1,
          false
        );
      }
    }
  }, [animated, rarity]);

  const animatedStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 10px rgba(${parseInt(badgeColor.slice(1,3), 16)}, ${parseInt(badgeColor.slice(3,5), 16)}, ${parseInt(badgeColor.slice(5,7), 16)}, ${glow.value})`,
  }));
  
  const rainbowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.hexBadge,
        {
          width: size,
          height: size * 1.15,
          borderColor: badgeColor,
        },
        animatedStyle,
      ]}
    >
      {rarity === 'legendary' && (
        <Animated.View style={[styles.legendaryRing, rainbowStyle]} />
      )}
      <Text style={[styles.hexIcon, { fontSize: size * 0.4, color: badgeColor }]}>
        {icon}
      </Text>
      {label && (
        <Text style={[styles.hexLabel, { color: badgeColor, fontSize: size * 0.12 }]}>
          {label}
        </Text>
      )}
    </Animated.View>
  );
};

// ============================================
// CRT FLICKER TEXT - Glitchy text
// ============================================
export const CRTFlickerText: React.FC<{
  children: string;
  style?: any;
  color?: string;
  glitch?: boolean;
}> = ({ children, style, color = CRT_COLORS.primary, glitch = false }) => {
  const opacity = useSharedValue(1);
  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (glitch) {
      const flickerInterval = setInterval(() => {
        if (Math.random() > 0.9) {
          opacity.value = withSequence(
            withTiming(0.3, { duration: 30 }),
            withTiming(1, { duration: 30 }),
            withTiming(0.7, { duration: 50 }),
            withTiming(1, { duration: 30 })
          );
          offsetX.value = withSequence(
            withTiming(3, { duration: 30 }),
            withTiming(-2, { duration: 30 }),
            withTiming(0, { duration: 30 })
          );
        }
      }, 2000);
      return () => clearInterval(flickerInterval);
    }
  }, [glitch]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offsetX.value }],
  }));

  return (
    <Animated.Text
      style={[
        {
          color,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          textShadow: `0 0 10px ${color}`,
        },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  glowBorder: {
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: CRT_COLORS.bgPanel,
    // Note: boxShadow color set dynamically via inline style
    elevation: 10,
  },
  hexBorder: {
    borderRadius: 4,
  },
  hexCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 2,
  },
  hexCornerTL: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  hexCornerTR: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  hexCornerBL: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  hexCornerBR: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  ghostHand: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostHandIcon: {
    fontSize: 32,
  },
  tapRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    opacity: 0.5,
  },
  hexBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
    borderWidth: 3,
    borderRadius: 8,
    // boxShadow set dynamically via animatedStyle
    elevation: 8,
  },
  legendaryRing: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#FF0000',
    borderRightColor: '#00FF00',
    borderBottomColor: '#0000FF',
    borderLeftColor: '#FFFF00',
  },
  hexIcon: {
    fontWeight: 'bold',
  },
  hexLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default {
  CRTScanlines,
  CRTGlowBorder,
  PixelRain,
  ParticleBurst,
  ConfettiBurst,
  ScreenShake,
  GhostHand,
  HexBadge,
  CRTFlickerText,
};
