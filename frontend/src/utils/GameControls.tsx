// BlockQuest Official - Enhanced Game Controls & Visuals
// Unified control system with keyboard, touch, and swipe support
// Enhanced visual effects: neon glow, trails, better particles

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { GameHaptics } from './GameEnhancements';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// KEYBOARD CONTROLS HOOK
// ============================================
export type KeyDirection = 'up' | 'down' | 'left' | 'right' | 'action' | 'pause';

interface UseKeyboardControlsOptions {
  onDirection: (direction: KeyDirection) => void;
  enabled?: boolean;
  repeatRate?: number; // ms between repeated key actions
}

export const useKeyboardControls = ({
  onDirection,
  enabled = true,
  repeatRate = 100,
}: UseKeyboardControlsOptions) => {
  const pressedKeys = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (pressedKeys.current.has(e.key)) return;
      pressedKeys.current.add(e.key);

      let direction: KeyDirection | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
        case ' ':
        case 'Enter':
          direction = 'action';
          break;
        case 'Escape':
        case 'p':
        case 'P':
          direction = 'pause';
          break;
      }

      if (direction) {
        e.preventDefault();
        onDirection(direction);
        GameHaptics.light();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, onDirection, repeatRate]);

  return null;
};

// ============================================
// ENHANCED D-PAD CONTROLS
// ============================================
interface EnhancedDPadProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: any;
  disabled?: boolean;
}

export const EnhancedDPad: React.FC<EnhancedDPadProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onAction,
  size = 'md',
  color = CRT_COLORS.primary,
  style,
  disabled = false,
}) => {
  const buttonSize = size === 'sm' ? 44 : size === 'lg' ? 64 : 54;
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22;
  
  const ButtonComponent: React.FC<{
    onPress: () => void;
    children: React.ReactNode;
    buttonStyle?: any;
  }> = ({ onPress, children, buttonStyle }) => {
    const scale = useSharedValue(1);
    const glow = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      shadowOpacity: glow.value,
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.9, { damping: 15 });
      glow.value = withTiming(0.8, { duration: 100 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 10 });
      glow.value = withTiming(0, { duration: 200 });
    };

    return (
      <Pressable
        onPress={() => {
          if (!disabled) {
            GameHaptics.light();
            onPress();
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            dpadStyles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderColor: color + '80',
              backgroundColor: color + '20',
              shadowColor: color,
              shadowRadius: 10,
            },
            buttonStyle,
            animatedStyle,
            disabled && { opacity: 0.5 },
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={[dpadStyles.container, style]}>
      <View style={dpadStyles.dpad}>
        {/* Up */}
        <ButtonComponent onPress={onUp}>
          <Text style={[dpadStyles.arrow, { fontSize, color }]}>▲</Text>
        </ButtonComponent>

        {/* Middle Row */}
        <View style={dpadStyles.middleRow}>
          <ButtonComponent onPress={onLeft}>
            <Text style={[dpadStyles.arrow, { fontSize, color }]}>◀</Text>
          </ButtonComponent>

          {onAction ? (
            <ButtonComponent
              onPress={onAction}
              buttonStyle={[
                dpadStyles.actionButton,
                { backgroundColor: '#FF6B6B30', borderColor: '#FF6B6B80' },
              ]}
            >
              <Text style={[dpadStyles.actionText, { fontSize: fontSize * 1.2 }]}>●</Text>
            </ButtonComponent>
          ) : (
            <View style={[dpadStyles.centerSpace, { width: buttonSize * 0.6, height: buttonSize * 0.6 }]} />
          )}

          <ButtonComponent onPress={onRight}>
            <Text style={[dpadStyles.arrow, { fontSize, color }]}>▶</Text>
          </ButtonComponent>
        </View>

        {/* Down */}
        <ButtonComponent onPress={onDown}>
          <Text style={[dpadStyles.arrow, { fontSize, color }]}>▼</Text>
        </ButtonComponent>
      </View>

      {/* Keyboard hint for web */}
      {Platform.OS === 'web' && (
        <Text style={dpadStyles.keyboardHint}>WASD or Arrow Keys</Text>
      )}
    </View>
  );
};

const dpadStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dpad: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSpace: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 6,
    margin: 2,
  },
  actionButton: {
    borderRadius: 27,
  },
  arrow: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 65, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  actionText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  keyboardHint: {
    marginTop: 8,
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
});

// ============================================
// NEON GLOW TEXT
// ============================================
interface NeonTextProps {
  children: string;
  color?: string;
  size?: number;
  intensity?: number;
  pulsate?: boolean;
  style?: any;
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  color = '#00FF41',
  size = 24,
  intensity = 1,
  pulsate = false,
  style,
}) => {
  const glowOpacity = useSharedValue(intensity);

  useEffect(() => {
    if (pulsate) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(intensity * 0.5, { duration: 800 }),
          withTiming(intensity, { duration: 800 })
        ),
        -1,
        true
      );
    }
    return () => cancelAnimation(glowOpacity);
  }, [pulsate, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    textShadowRadius: 10 * glowOpacity.value,
  }));

  return (
    <Animated.Text
      style={[
        neonStyles.text,
        {
          color,
          fontSize: size,
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
};

const neonStyles = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

// ============================================
// ENHANCED SCORE DISPLAY
// ============================================
interface ScoreDisplayProps {
  score: number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showCombo?: boolean;
  combo?: number;
  animate?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  label = 'SCORE',
  color = CRT_COLORS.accentGold,
  size = 'md',
  showCombo = false,
  combo = 0,
  animate = true,
}) => {
  const scale = useSharedValue(1);
  const prevScore = useRef(score);

  useEffect(() => {
    if (animate && score > prevScore.current) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    }
    prevScore.current = score;
  }, [score, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const labelSize = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;

  return (
    <Animated.View style={[scoreDisplayStyles.container, animatedStyle]}>
      <Text style={[scoreDisplayStyles.label, { fontSize: labelSize }]}>{label}</Text>
      <Text style={[scoreDisplayStyles.score, { fontSize, color }]}>{score.toLocaleString()}</Text>
      {showCombo && combo > 1 && (
        <View style={[scoreDisplayStyles.comboBadge, { backgroundColor: color + '30' }]}>
          <Text style={[scoreDisplayStyles.comboText, { color }]}>x{combo}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const scoreDisplayStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: CRT_COLORS.bgMedium,
  },
  label: {
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  score: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  comboBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comboText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

// ============================================
// GAME HEADER COMPONENT
// ============================================
interface GameHeaderProps {
  title: string;
  titleIcon?: string;
  score: number;
  onBack: () => void;
  onPause?: () => void;
  extraInfo?: { label: string; value: string | number; color?: string }[];
  color?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  titleIcon = '🎮',
  score,
  onBack,
  onPause,
  extraInfo = [],
  color = CRT_COLORS.accentGold,
}) => {
  return (
    <View style={headerStyles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => { GameHaptics.light(); onBack(); }} 
        style={headerStyles.backButton}
        accessibilityLabel="Go back"
      >
        <Text style={headerStyles.backText}>←</Text>
      </TouchableOpacity>

      {/* Title */}
      <View style={headerStyles.titleContainer}>
        <Text style={headerStyles.titleIcon}>{titleIcon}</Text>
        <NeonText color={color} size={14}>
          {title}
        </NeonText>
      </View>

      {/* Score + Extra Info */}
      <View style={headerStyles.rightSection}>
        {extraInfo.map((info, idx) => (
          <View key={idx} style={headerStyles.infoBox}>
            <Text style={headerStyles.infoLabel}>{info.label}</Text>
            <Text style={[headerStyles.infoValue, { color: info.color || CRT_COLORS.accentCyan }]}>
              {info.value}
            </Text>
          </View>
        ))}
        <ScoreDisplay score={score} size="sm" color={color} />
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: CRT_COLORS.bgDark + 'E0',
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.bgMedium,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
  },
  backText: {
    fontSize: 22,
    color: CRT_COLORS.primary,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 18,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoLabel: {
    fontSize: 7,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

// ============================================
// ENHANCED PARTICLE TRAIL
// ============================================
interface TrailParticle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ParticleTrailProps {
  particles: TrailParticle[];
  size?: number;
}

const TrailDot: React.FC<{ particle: TrailParticle; size: number; index: number; total: number }> = ({
  particle,
  size,
  index,
  total,
}) => {
  const opacity = useSharedValue((total - index) / total);
  const scale = useSharedValue((total - index) / total);

  useEffect(() => {
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        trailStyles.dot,
        {
          left: particle.x - size / 2,
          top: particle.y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: particle.color,
          shadowColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const ParticleTrail: React.FC<ParticleTrailProps> = ({ particles, size = 6 }) => {
  return (
    <View style={trailStyles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <TrailDot
          key={particle.id}
          particle={particle}
          size={size}
          index={index}
          total={particles.length}
        />
      ))}
    </View>
  );
};

const trailStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  dot: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

// ============================================
// COLLECT EFFECT (SPARKLE BURST)
// ============================================
interface CollectEffectProps {
  x: number;
  y: number;
  color?: string;
  trigger: number;
}

export const CollectEffect: React.FC<CollectEffectProps> = ({
  x,
  y,
  color = '#FFD700',
  trigger,
}) => {
  const [sparkles, setSparkles] = useState<{ id: number; angle: number }[]>([]);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger > 0) {
      // Create sparkles
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        angle: i * 60,
      }));
      setSparkles(newSparkles);

      // Animate ring
      ringScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(2, { duration: 300, easing: Easing.out(Easing.cubic) })
      );
      ringOpacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 250 })
      );

      setTimeout(() => setSparkles([]), 400);
    }
  }, [trigger]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[collectStyles.container, { left: x - 30, top: y - 30 }]} pointerEvents="none">
      <Animated.View style={[collectStyles.ring, { borderColor: color }, ringStyle]} />
      {sparkles.map((sparkle) => (
        <SparkleParticle key={sparkle.id} angle={sparkle.angle} color={color} />
      ))}
    </View>
  );
};

const SparkleParticle: React.FC<{ angle: number; color: string }> = ({ angle, color }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const radians = (angle * Math.PI) / 180;
    const distance = 40;

    translateX.value = withTiming(Math.cos(radians) * distance, { duration: 300 });
    translateY.value = withTiming(Math.sin(radians) * distance, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withSequence(
      withTiming(1.5, { duration: 100 }),
      withTiming(0, { duration: 200 })
    );
    rotation.value = withTiming(180, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[collectStyles.sparkle, animatedStyle]}>
      <Text style={[collectStyles.sparkleText, { color }]}>✦</Text>
    </Animated.View>
  );
};

const collectStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  ring: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// ============================================
// GAME PROGRESS BAR
// ============================================
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export const GameProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  color = CRT_COLORS.primary,
  height = 8,
  showLabel = true,
  animated = true,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = animated
      ? withSpring(Math.min(100, Math.max(0, progress)), { damping: 15 })
      : progress;
  }, [progress, animated]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={progressStyles.container}>
      {showLabel && label && (
        <Text style={progressStyles.label}>{label}</Text>
      )}
      <View style={[progressStyles.track, { height }]}>
        <Animated.View
          style={[
            progressStyles.fill,
            { backgroundColor: color, height },
            fillStyle,
          ]}
        />
        <View style={[progressStyles.glow, { backgroundColor: color }]} />
      </View>
      {showLabel && (
        <Text style={[progressStyles.percentage, { color }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minWidth: 50,
  },
  track: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
  },
  percentage: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
});

// ============================================
// LIVES DISPLAY
// ============================================
interface LivesDisplayProps {
  lives: number;
  maxLives?: number;
  icon?: string;
  color?: string;
}

export const LivesDisplay: React.FC<LivesDisplayProps> = ({
  lives,
  maxLives = 3,
  icon = '❤️',
  color = '#FF6B6B',
}) => {
  return (
    <View style={livesStyles.container}>
      {Array.from({ length: maxLives }, (_, i) => (
        <Text
          key={i}
          style={[
            livesStyles.icon,
            i >= lives && livesStyles.iconEmpty,
          ]}
        >
          {icon}
        </Text>
      ))}
    </View>
  );
};

const livesStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  icon: {
    fontSize: 18,
  },
  iconEmpty: {
    opacity: 0.3,
  },
});

// ============================================
// GAME INSTRUCTIONS OVERLAY
// ============================================
interface InstructionItem {
  icon: string;
  text: string;
}

interface GameInstructionsProps {
  title: string;
  instructions: InstructionItem[];
  onStart: () => void;
  color?: string;
  highScore?: number;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  title,
  instructions,
  onStart,
  color = CRT_COLORS.accentGold,
  highScore,
}) => {
  return (
    <View style={instructionStyles.container}>
      <NeonText color={color} size={28} pulsate>
        {title}
      </NeonText>

      <View style={instructionStyles.box}>
        {instructions.map((item, idx) => (
          <View key={idx} style={instructionStyles.item}>
            <Text style={instructionStyles.icon}>{item.icon}</Text>
            <Text style={instructionStyles.text}>{item.text}</Text>
          </View>
        ))}
      </View>

      {highScore !== undefined && highScore > 0 && (
        <Text style={[instructionStyles.highScore, { color }]}>
          🏆 High Score: {highScore.toLocaleString()}
        </Text>
      )}

      <TouchableOpacity
        style={[instructionStyles.startButton, { backgroundColor: color }]}
        onPress={() => { GameHaptics.medium(); onStart(); }}
      >
        <Text style={instructionStyles.startText}>▶ START</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <Text style={instructionStyles.keyHint}>
          Press SPACE or ENTER to start
        </Text>
      )}
    </View>
  );
};

const instructionStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  highScore: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  startText: {
    fontSize: 18,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  keyHint: {
    marginTop: 12,
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default {
  useKeyboardControls,
  EnhancedDPad,
  NeonText,
  ScoreDisplay,
  GameHeader,
  ParticleTrail,
  CollectEffect,
  GameProgressBar,
  LivesDisplay,
  GameInstructions,
};
