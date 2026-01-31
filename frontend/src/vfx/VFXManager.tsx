// Block Quest Official - VFX Manager
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type VFXType = 
  | 'pixel-chain-rain'
  | 'holographic-scan'
  | 'nft-flip'
  | 'glitch-lock'
  | 'pow-sparks'
  | 'crt-breathe'
  | 'seed-starfield'
  | 'lightning-beams'
  | 'parallax-blocks'
  | 'gear-turn'
  | 'dao-fireworks'
  | 'ipfs-orbit'
  | 'attack-alert'
  | 'gas-burn'
  | 'genesis-birth';

interface VFXProps {
  type: VFXType;
  active?: boolean;
  intensity?: number;
}

// Individual VFX Components
const PixelChainRain: React.FC<{ intensity: number }> = ({ intensity }) => {
  const drops = Array(15).fill(0).map((_, i) => ({
    id: i,
    x: (i * (SCREEN_WIDTH / 15)) + Math.random() * 20,
    delay: Math.random() * 2000,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {drops.map((drop) => (
        <RainDrop key={drop.id} x={drop.x} delay={drop.delay} intensity={intensity} />
      ))}
    </View>
  );
};

const RainDrop: React.FC<{ x: number; delay: number; intensity: number }> = ({ x, delay, intensity }) => {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(SCREEN_HEIGHT + 50, { duration: 2000 / intensity, easing: Easing.linear }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.7, { duration: 1500 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.rainDrop, { left: x }, animatedStyle]}>
      <View style={styles.dropBlock} />
      <View style={[styles.dropBlock, { backgroundColor: COLORS.chainGold, marginTop: 2 }]} />
      <View style={[styles.dropBlock, { marginTop: 2 }]} />
    </Animated.View>
  );
};

const HolographicScan: React.FC<{ intensity: number }> = ({ intensity }) => {
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCREEN_HEIGHT, { duration: 3000 / intensity, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  return (
    <Animated.View style={[styles.scanLine, animatedStyle, { pointerEvents: 'none' }]} />
  );
};

const CRTBreathe: React.FC<{ intensity: number }> = ({ intensity }) => {
  const scanlineOpacity = useSharedValue(0.1);
  const scale = useSharedValue(1);

  useEffect(() => {
    scanlineOpacity.value = withRepeat(
      withTiming(0.3 * intensity, { duration: 2000 }),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.002, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [intensity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    opacity: scanlineOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle, { pointerEvents: 'none' }]}>
      <Animated.View style={[styles.scanlines, scanlineStyle]} />
      <View style={styles.vignette} />
    </Animated.View>
  );
};

const ParallaxBlocks: React.FC<{ intensity: number }> = ({ intensity }) => {
  const layer1X = useSharedValue(0);
  const layer2X = useSharedValue(0);
  const layer3X = useSharedValue(0);

  useEffect(() => {
    layer1X.value = withRepeat(
      withTiming(-100, { duration: 10000 / intensity, easing: Easing.linear }),
      -1,
      false
    );
    layer2X.value = withRepeat(
      withTiming(-100, { duration: 7000 / intensity, easing: Easing.linear }),
      -1,
      false
    );
    layer3X.value = withRepeat(
      withTiming(-100, { duration: 5000 / intensity, easing: Easing.linear }),
      -1,
      false
    );
  }, [intensity]);

  const layer1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: layer1X.value }],
  }));

  const layer2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: layer2X.value }],
  }));

  const layer3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: layer3X.value }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Animated.View style={[styles.parallaxLayer, { bottom: 50, opacity: 0.2 }, layer1Style]}>
        {Array(10).fill(0).map((_, i) => (
          <View key={i} style={[styles.parallaxBlock, { left: i * 50, backgroundColor: COLORS.blockCyan }]} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.parallaxLayer, { bottom: 100, opacity: 0.4 }, layer2Style]}>
        {Array(8).fill(0).map((_, i) => (
          <View key={i} style={[styles.parallaxBlock, { left: i * 70, width: 16, height: 16, backgroundColor: COLORS.chainGold }]} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.parallaxLayer, { bottom: 160, opacity: 0.6 }, layer3Style]}>
        {Array(6).fill(0).map((_, i) => (
          <View key={i} style={[styles.parallaxBlock, { left: i * 100, width: 20, height: 20, backgroundColor: COLORS.tokenPurple }]} />
        ))}
      </Animated.View>
    </View>
  );
};

const GlitchLock: React.FC<{ intensity: number }> = ({ intensity }) => {
  const glitchX = useSharedValue(0);
  const glitchOpacity = useSharedValue(0);

  useEffect(() => {
    const triggerGlitch = () => {
      glitchOpacity.value = withSequence(
        withTiming(0.8, { duration: 50 }),
        withTiming(0, { duration: 100 }),
        withTiming(0.6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      glitchX.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    };

    const interval = setInterval(triggerGlitch, 4000 / intensity);
    return () => clearInterval(interval);
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
    opacity: glitchOpacity.value,
  }));

  return (
    <Animated.View style={[styles.glitchOverlay, animatedStyle, { pointerEvents: 'none' }]}>
      <View style={styles.glitchLine} />
      <View style={[styles.glitchLine, { top: '30%', backgroundColor: COLORS.vfxScan }]} />
      <View style={[styles.glitchLine, { top: '60%', backgroundColor: COLORS.chainGold }]} />
    </Animated.View>
  );
};

const IPFSOrbit: React.FC<{ intensity: number }> = ({ intensity }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000 / intensity, easing: Easing.linear }),
      -1,
      false
    );
  }, [intensity]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.orbitContainer, { pointerEvents: 'none' }]}>
      <Animated.View style={[styles.orbitPath, orbitStyle]}>
        <View style={styles.orbitDot} />
      </Animated.View>
    </View>
  );
};

const GenesisBirth: React.FC<{ intensity: number; onComplete?: () => void }> = ({ intensity, onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const particleScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1.5, { damping: 8, stiffness: 100 });
    particleScale.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(2, { duration: 1000 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 1500 })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.genesisContainer, containerStyle, { pointerEvents: 'none' }]}>
      <Animated.View style={[styles.genesisBurst, burstStyle]}>
        <View style={styles.genesisCore} />
      </Animated.View>
      {Array(12).fill(0).map((_, i) => (
        <GenesisParticle key={i} angle={i * 30} delay={i * 50} />
      ))}
    </Animated.View>
  );
};

const GenesisParticle: React.FC<{ angle: number; delay: number }> = ({ angle, delay }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const radians = (angle * Math.PI) / 180;
      translateX.value = withTiming(Math.cos(radians) * 150, { duration: 1000 });
      translateY.value = withTiming(Math.sin(radians) * 150, { duration: 1000 });
      opacity.value = withTiming(0, { duration: 1200 });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.genesisParticle, animatedStyle]} />;
};

// Main VFX Component
export const VFXLayer: React.FC<VFXProps> = ({ type, active = true, intensity = 1 }) => {
  const { vfxEnabled, vfxIntensity } = useGameStore();

  if (!vfxEnabled || !active) return null;

  const effectiveIntensity = intensity * vfxIntensity;

  switch (type) {
    case 'pixel-chain-rain':
      return <PixelChainRain intensity={effectiveIntensity} />;
    case 'holographic-scan':
      return <HolographicScan intensity={effectiveIntensity} />;
    case 'crt-breathe':
      return <CRTBreathe intensity={effectiveIntensity} />;
    case 'parallax-blocks':
      return <ParallaxBlocks intensity={effectiveIntensity} />;
    case 'glitch-lock':
      return <GlitchLock intensity={effectiveIntensity} />;
    case 'ipfs-orbit':
      return <IPFSOrbit intensity={effectiveIntensity} />;
    case 'genesis-birth':
      return <GenesisBirth intensity={effectiveIntensity} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  rainDrop: {
    position: 'absolute',
    top: -50,
  },
  dropBlock: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.blockCyan,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.vfxScan,
    boxShadow: `0 0 10px ${COLORS.vfxScan}CC`,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 40,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  parallaxLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
  parallaxBlock: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  glitchOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glitchLine: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.vfxAlert,
  },
  orbitContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitPath: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.tokenPurple,
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.chainGold,
    marginTop: -4,
  },
  genesisContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  genesisBurst: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.chainGold,
    boxShadow: `0 0 40px ${COLORS.chainGold}`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genesisCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  genesisParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: COLORS.chainGold,
  },
});

export default VFXLayer;
