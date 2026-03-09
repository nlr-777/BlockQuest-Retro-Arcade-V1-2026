// BlockQuest Official - Confetti/Retro Animation Effect
// Fun celebration animations for unlocks and completions

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  shape: 'square' | 'circle' | 'triangle';
}

const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF6B6B', // Coral
  '#00FF88', // Green
  '#A855F7', // Purple
  '#FF69B4', // Pink
  '#00CED1', // Teal
];

const SHAPES = ['square', 'circle', 'triangle'] as const;

interface ConfettiEffectProps {
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
  pieceCount?: number;
}

const ConfettiPieceComponent: React.FC<{ piece: ConfettiPiece }> = ({ piece }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Initial pop animation
    scale.value = withDelay(
      piece.delay,
      withSpring(1, { damping: 8 })
    );
    
    // Fall animation
    translateY.value = withDelay(
      piece.delay + 100,
      withTiming(SCREEN_HEIGHT + 100, { duration: 2500 })
    );
    
    // Horizontal drift
    const drift = (Math.random() - 0.5) * 200;
    translateX.value = withDelay(
      piece.delay,
      withTiming(drift, { duration: 2500 })
    );
    
    // Rotation
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + Math.random() * 720, { duration: 2500 })
    );
    
    // Fade out at end
    opacity.value = withDelay(
      piece.delay + 2000,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getShape = () => {
    switch (piece.shape) {
      case 'circle':
        return {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: piece.color,
        };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderBottomWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: piece.color,
          backgroundColor: 'transparent',
        };
      default:
        return {
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: piece.color,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { left: piece.x },
        getShape(),
        animatedStyle,
      ]}
    />
  );
};

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  visible,
  onComplete,
  duration = 3000,
  pieceCount = 50,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (visible) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: Math.random() * 500,
          rotation: Math.random() * 360,
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        });
      }
      setPieces(newPieces);

      // Call onComplete after duration
      if (onComplete) {
        const timeout = setTimeout(onComplete, duration);
        return () => clearTimeout(timeout);
      }
    } else {
      setPieces([]);
    }
  }, [visible, pieceCount, duration, onComplete]);

  if (!visible || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}
    </View>
  );
};

// Retro pixel burst effect for unlocks
interface PixelBurstProps {
  visible: boolean;
  color?: string;
  onComplete?: () => void;
}

export const PixelBurstEffect: React.FC<PixelBurstProps> = ({
  visible,
  color = '#FFD700',
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(2.5, { damping: 6 }),
        withTiming(3, { duration: 300 })
      );
      opacity.value = withDelay(
        400,
        withTiming(0, { duration: 200 })
      );

      if (onComplete) {
        setTimeout(onComplete, 600);
      }
    } else {
      scale.value = 0;
      opacity.value = 1;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.burstContainer} pointerEvents="none">
      <Animated.View style={[styles.burstRing, { borderColor: color }, animatedStyle]} />
      <Animated.View style={[styles.burstRing2, { borderColor: color }, animatedStyle]} />
    </View>
  );
};

// Star burst effect
interface StarBurstProps {
  visible: boolean;
  onComplete?: () => void;
}

export const StarBurstEffect: React.FC<StarBurstProps> = ({ visible, onComplete }) => {
  const [stars, setStars] = useState<{ id: number; angle: number; color: string }[]>([]);

  useEffect(() => {
    if (visible) {
      const newStars = [];
      for (let i = 0; i < 8; i++) {
        newStars.push({
          id: i,
          angle: i * 45,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        });
      }
      setStars(newStars);

      if (onComplete) {
        setTimeout(onComplete, 800);
      }
    } else {
      setStars([]);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.starBurstContainer} pointerEvents="none">
      {stars.map((star) => (
        <StarParticle key={star.id} angle={star.angle} color={star.color} />
      ))}
    </View>
  );
};

const StarParticle: React.FC<{ angle: number; color: string }> = ({ angle, color }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const radians = (angle * Math.PI) / 180;
    const distance = 100;
    
    scale.value = withSpring(1, { damping: 8 });
    translateX.value = withTiming(Math.cos(radians) * distance, { duration: 600 });
    translateY.value = withTiming(Math.sin(radians) * distance, { duration: 600 });
    opacity.value = withDelay(400, withTiming(0, { duration: 200 }));
  }, [angle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.starParticle, { backgroundColor: color }, animatedStyle]}>
      <View style={styles.starInner} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  burstRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  burstRing2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  starBurstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  starParticle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
});

export default ConfettiEffect;
