// BlockQuest Official - Game Enhancements Utility
// Provides reusable enhancements for all games:
// - Touch controls with gestures
// - Visual effects (particles, screen shake, combos)
// - Haptic feedback
// - Power-ups system
// - Difficulty scaling

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Text,
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
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CRT_COLORS } from '../constants/crtTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// HAPTIC FEEDBACK SYSTEM
// ============================================
export const GameHaptics = {
  // Light tap - button presses, small actions
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  // Medium impact - collecting items, scoring
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  
  // Heavy impact - collisions, big events
  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  
  // Success - achievements, level complete
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  
  // Warning - low health, danger
  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  
  // Error - death, game over
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  
  // Selection changed
  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  },
  
  // Combo pattern - escalating vibrations
  combo: (count: number) => {
    if (Platform.OS !== 'web') {
      const intensity = Math.min(count, 5);
      for (let i = 0; i < intensity; i++) {
        setTimeout(() => {
          Haptics.impactAsync(
            i < 2 ? Haptics.ImpactFeedbackStyle.Light :
            i < 4 ? Haptics.ImpactFeedbackStyle.Medium :
            Haptics.ImpactFeedbackStyle.Heavy
          );
        }, i * 50);
      }
    }
  },
};

// ============================================
// SWIPE GESTURE HOOK
// ============================================
export type SwipeDirection = 'up' | 'down' | 'left' | 'right' | 'tap';

interface UseSwipeGestureOptions {
  onSwipe: (direction: SwipeDirection) => void;
  onTap?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useSwipeGesture = ({
  onSwipe,
  onTap,
  threshold = 30,
  enabled = true,
}: UseSwipeGestureOptions) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        
        // Determine if it's a swipe or tap
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        
        if (absX < threshold && absY < threshold) {
          // It's a tap
          if (onTap) {
            GameHaptics.light();
            onTap();
          } else {
            onSwipe('tap');
          }
          return;
        }
        
        GameHaptics.selection();
        
        if (absX > absY) {
          // Horizontal swipe
          onSwipe(dx > 0 ? 'right' : 'left');
        } else {
          // Vertical swipe
          onSwipe(dy > 0 ? 'down' : 'up');
        }
      },
    })
  ).current;
  
  return panResponder;
};

// ============================================
// SCREEN SHAKE COMPONENT
// ============================================
interface ScreenShakeProps {
  children: React.ReactNode;
  intensity?: number;
  trigger: number; // Increment to trigger shake
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  children,
  intensity = 10,
  trigger,
}) => {
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  
  useEffect(() => {
    if (trigger > 0) {
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
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger, intensity]);
  
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
// COMBO DISPLAY COMPONENT
// ============================================
interface ComboDisplayProps {
  combo: number;
  visible: boolean;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({ combo, visible }) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    if (visible && combo > 1) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 5 }),
        withSpring(1, { damping: 8 })
      );
      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [combo, visible]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  if (combo < 2) return null;
  
  const comboColor = 
    combo >= 10 ? '#FF00FF' :
    combo >= 7 ? '#FFD700' :
    combo >= 5 ? '#00FFFF' :
    combo >= 3 ? '#00FF00' :
    '#FFFFFF';
  
  const comboText = 
    combo >= 10 ? 'LEGENDARY!' :
    combo >= 7 ? 'AMAZING!' :
    combo >= 5 ? 'GREAT!' :
    combo >= 3 ? 'NICE!' :
    '';
  
  return (
    <Animated.View style={[comboStyles.container, animatedStyle]}>
      <Text style={[comboStyles.comboNumber, { color: comboColor }]}>
        {combo}x
      </Text>
      <Text style={[comboStyles.comboText, { color: comboColor }]}>
        COMBO {comboText}
      </Text>
    </Animated.View>
  );
};

const comboStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  comboNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  comboText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
});

// ============================================
// FLOATING SCORE POPUP
// ============================================
interface ScorePopup {
  id: number;
  value: number;
  x: number;
  y: number;
  type: 'normal' | 'bonus' | 'combo' | 'penalty';
}

interface FloatingScoreProps {
  popups: ScorePopup[];
}

const FloatingScoreItem: React.FC<{ popup: ScorePopup }> = ({ popup }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);
  
  useEffect(() => {
    scale.value = withSpring(1, { damping: 8 });
    translateY.value = withTiming(-60, { duration: 1000 });
    opacity.value = withDelay(600, withTiming(0, { duration: 400 }));
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  const color = 
    popup.type === 'bonus' ? '#FFD700' :
    popup.type === 'combo' ? '#00FFFF' :
    popup.type === 'penalty' ? '#FF4444' :
    '#00FF00';
  
  const prefix = popup.value >= 0 ? '+' : '';
  
  return (
    <Animated.View 
      style={[
        floatingStyles.popup,
        { left: popup.x, top: popup.y },
        animatedStyle
      ]}
    >
      <Text style={[floatingStyles.text, { color }]}>
        {prefix}{popup.value}
      </Text>
    </Animated.View>
  );
};

export const FloatingScores: React.FC<FloatingScoreProps> = ({ popups }) => {
  return (
    <View style={floatingStyles.container} pointerEvents="none">
      {popups.map(popup => (
        <FloatingScoreItem key={popup.id} popup={popup} />
      ))}
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  popup: {
    position: 'absolute',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

// ============================================
// FLOATING SCORES HOOK
// ============================================
export const useFloatingScores = () => {
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const idRef = useRef(0);
  
  const addPopup = useCallback((
    value: number,
    x: number,
    y: number,
    type: ScorePopup['type'] = 'normal'
  ) => {
    const id = idRef.current++;
    setPopups(prev => [...prev, { id, value, x, y, type }]);
    
    // Auto remove after animation
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 1200);
  }, []);
  
  return { popups, addPopup, FloatingScoresComponent: () => <FloatingScores popups={popups} /> };
};

// ============================================
// COMBO SYSTEM HOOK
// ============================================
export const useComboSystem = (resetDelay: number = 2000) => {
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const incrementCombo = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setCombo(prev => {
      const newCombo = prev + 1;
      setShowCombo(true);
      
      // Haptic feedback based on combo level
      if (newCombo >= 10) {
        GameHaptics.success();
      } else if (newCombo >= 5) {
        GameHaptics.heavy();
      } else if (newCombo >= 3) {
        GameHaptics.medium();
      } else {
        GameHaptics.light();
      }
      
      return newCombo;
    });
    
    // Set timer to reset combo
    timerRef.current = setTimeout(() => {
      setCombo(0);
      setShowCombo(false);
    }, resetDelay);
  }, [resetDelay]);
  
  const resetCombo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCombo(0);
    setShowCombo(false);
  }, []);
  
  const getMultiplier = useCallback(() => {
    if (combo >= 10) return 3.0;
    if (combo >= 7) return 2.5;
    if (combo >= 5) return 2.0;
    if (combo >= 3) return 1.5;
    return 1.0;
  }, [combo]);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return {
    combo,
    showCombo,
    incrementCombo,
    resetCombo,
    getMultiplier,
  };
};

// ============================================
// DIFFICULTY SCALING HOOK
// ============================================
interface DifficultyConfig {
  speedMultiplier: number;
  spawnRate: number;
  scoreMultiplier: number;
  difficultyName: string;
}

export const useDifficultyScaling = (score: number) => {
  const [difficulty, setDifficulty] = useState<DifficultyConfig>({
    speedMultiplier: 1.0,
    spawnRate: 1.0,
    scoreMultiplier: 1.0,
    difficultyName: 'EASY',
  });
  
  useEffect(() => {
    let newDifficulty: DifficultyConfig;
    
    if (score >= 5000) {
      newDifficulty = {
        speedMultiplier: 2.0,
        spawnRate: 0.5,
        scoreMultiplier: 3.0,
        difficultyName: 'INSANE',
      };
    } else if (score >= 3000) {
      newDifficulty = {
        speedMultiplier: 1.7,
        spawnRate: 0.6,
        scoreMultiplier: 2.5,
        difficultyName: 'HARD',
      };
    } else if (score >= 1500) {
      newDifficulty = {
        speedMultiplier: 1.4,
        spawnRate: 0.75,
        scoreMultiplier: 2.0,
        difficultyName: 'MEDIUM',
      };
    } else if (score >= 500) {
      newDifficulty = {
        speedMultiplier: 1.2,
        spawnRate: 0.85,
        scoreMultiplier: 1.5,
        difficultyName: 'NORMAL',
      };
    } else {
      newDifficulty = {
        speedMultiplier: 1.0,
        spawnRate: 1.0,
        scoreMultiplier: 1.0,
        difficultyName: 'EASY',
      };
    }
    
    setDifficulty(newDifficulty);
  }, [score]);
  
  return difficulty;
};

// ============================================
// PARTICLE BURST COMPONENT
// ============================================
interface ParticleBurstProps {
  x: number;
  y: number;
  color?: string;
  count?: number;
  trigger: number;
}

const Particle: React.FC<{
  startX: number;
  startY: number;
  color: string;
  angle: number;
  speed: number;
}> = ({ startX, startY, color, angle, speed }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    const radians = (angle * Math.PI) / 180;
    const distance = speed * 50;
    
    translateX.value = withTiming(Math.cos(radians) * distance, { duration: 600 });
    translateY.value = withTiming(Math.sin(radians) * distance, { duration: 600 });
    opacity.value = withTiming(0, { duration: 600 });
    scale.value = withTiming(0, { duration: 600 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        particleStyles.particle,
        { left: startX, top: startY, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  x,
  y,
  color = '#FFD700',
  count = 8,
  trigger,
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; speed: number }>>([]);
  
  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        angle: (360 / count) * i + Math.random() * 30,
        speed: 0.5 + Math.random() * 1.5,
      }));
      setParticles(newParticles);
      
      // Clean up after animation
      setTimeout(() => setParticles([]), 700);
    }
  }, [trigger, count]);
  
  return (
    <View style={particleStyles.container} pointerEvents="none">
      {particles.map(p => (
        <Particle
          key={p.id}
          startX={x}
          startY={y}
          color={color}
          angle={p.angle}
          speed={p.speed}
        />
      ))}
    </View>
  );
};

const particleStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// ============================================
// ENHANCED TOUCH AREA
// ============================================
interface TouchControlsProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onAction?: () => void;
  style?: any;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onAction,
  style,
}) => {
  return (
    <View style={[touchStyles.container, style]}>
      {/* D-Pad style controls */}
      <View style={touchStyles.dpad}>
        {/* Up */}
        <TouchableOpacity
          style={[touchStyles.button, touchStyles.buttonUp]}
          onPress={() => { GameHaptics.light(); onUp(); }}
          activeOpacity={0.7}
        >
          <Text style={touchStyles.arrow}>▲</Text>
        </TouchableOpacity>
        
        {/* Middle row */}
        <View style={touchStyles.middleRow}>
          <TouchableOpacity
            style={[touchStyles.button, touchStyles.buttonSide]}
            onPress={() => { GameHaptics.light(); onLeft(); }}
            activeOpacity={0.7}
          >
            <Text style={touchStyles.arrow}>◀</Text>
          </TouchableOpacity>
          
          {onAction && (
            <TouchableOpacity
              style={[touchStyles.button, touchStyles.actionButton]}
              onPress={() => { GameHaptics.medium(); onAction(); }}
              activeOpacity={0.7}
            >
              <Text style={touchStyles.actionText}>●</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[touchStyles.button, touchStyles.buttonSide]}
            onPress={() => { GameHaptics.light(); onRight(); }}
            activeOpacity={0.7}
          >
            <Text style={touchStyles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>
        
        {/* Down */}
        <TouchableOpacity
          style={[touchStyles.button, touchStyles.buttonDown]}
          onPress={() => { GameHaptics.light(); onDown(); }}
          activeOpacity={0.7}
        >
          <Text style={touchStyles.arrow}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const touchStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpad: {
    alignItems: 'center',
  },
  button: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0, 255, 65, 0.2)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 65, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonUp: {
    marginBottom: 4,
  },
  buttonDown: {
    marginTop: 4,
  },
  buttonSide: {
    marginHorizontal: 4,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    borderColor: 'rgba(255, 100, 100, 0.6)',
  },
  arrow: {
    fontSize: 24,
    color: '#00FF41',
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: 28,
    color: '#FF6464',
  },
});

// ============================================
// POWER-UP TYPES
// ============================================
export type PowerUpType = 
  | 'shield'      // Invincibility
  | 'magnet'      // Attract collectibles
  | 'slowmo'      // Slow down time
  | 'double'      // Double points
  | 'extra_life'  // Extra life
  | 'bomb'        // Clear screen
  | 'speed';      // Speed boost

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  startTime: number;
}

// ============================================
// LEVEL UP FLASH
// ============================================
interface LevelUpFlashProps {
  trigger: number;
  level: number;
}

export const LevelUpFlash: React.FC<LevelUpFlashProps> = ({ trigger, level }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  
  useEffect(() => {
    if (trigger > 0) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 300 })
      );
      scale.value = withSequence(
        withSpring(1.2, { damping: 5 }),
        withTiming(1, { duration: 500 }),
        withTiming(1.5, { duration: 300 })
      );
    }
  }, [trigger]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[levelUpStyles.container, animatedStyle]} pointerEvents="none">
      <Text style={levelUpStyles.levelText}>LEVEL {level}</Text>
      <Text style={levelUpStyles.upText}>LEVEL UP!</Text>
    </Animated.View>
  );
};

const levelUpStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    zIndex: 100,
  },
  levelText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00FF41',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#00FF41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  upText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
});

// ============================================
// DANGER WARNING
// ============================================
interface DangerWarningProps {
  active: boolean;
}

export const DangerWarning: React.FC<DangerWarningProps> = ({ active }) => {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 100 });
    }
  }, [active]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={[dangerStyles.overlay, animatedStyle]} pointerEvents="none" />
  );
};

const dangerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF0000',
    zIndex: 90,
  },
});

// ============================================
// EXPORT ALL
// ============================================
export {
  ScreenShake,
  ComboDisplay,
  FloatingScores,
  ParticleBurst,
  TouchControls,
  LevelUpFlash,
  DangerWarning,
};
