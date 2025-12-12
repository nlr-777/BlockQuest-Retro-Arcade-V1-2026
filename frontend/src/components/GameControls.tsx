// BlockQuest Official - Game Controls Component
// Shared retro-styled control components for all games
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { COLORS } from '../constants/colors';
import { PixelText } from './PixelText';

// D-Pad Control Component
interface DPadProps {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showDiagonals?: boolean;
}

export const DPad: React.FC<DPadProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  color = COLORS.neonCyan,
  size = 'md',
}) => {
  const buttonSize = size === 'sm' ? 44 : size === 'lg' ? 60 : 52;
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 30;

  const DPadButton: React.FC<{
    direction: 'up' | 'down' | 'left' | 'right';
    onPress?: () => void;
    icon: string;
  }> = ({ direction, onPress, icon }) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
      scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.dpadButton,
            { 
              width: buttonSize, 
              height: buttonSize,
              borderColor: color + '80',
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
          disabled={!onPress}
        >
          <Ionicons name={icon as any} size={iconSize} color={color} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.dpadContainer}>
      <View style={styles.dpadRow}>
        <DPadButton direction="up" onPress={onUp} icon="caret-up" />
      </View>
      <View style={styles.dpadRow}>
        <DPadButton direction="left" onPress={onLeft} icon="caret-back" />
        <View style={[styles.dpadCenter, { width: buttonSize * 0.6, height: buttonSize * 0.6 }]} />
        <DPadButton direction="right" onPress={onRight} icon="caret-forward" />
      </View>
      <View style={styles.dpadRow}>
        <DPadButton direction="down" onPress={onDown} icon="caret-down" />
      </View>
    </View>
  );
};

// Action Button Component
interface ActionButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onPress,
  onPressIn,
  onPressOut,
  color = COLORS.neonPink,
  size = 'md',
  disabled = false,
}) => {
  const buttonSize = size === 'sm' ? 60 : size === 'lg' ? 90 : 75;
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    onPressOut?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: color + '20',
            borderColor: color,
          },
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {icon && <Ionicons name={icon as any} size={buttonSize * 0.4} color={color} />}
        <PixelText size="xs" color={color} style={styles.actionLabel}>
          {label}
        </PixelText>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Horizontal Controls (Left/Right + Action)
interface HorizontalControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onAction: () => void;
  actionLabel?: string;
  actionIcon?: string;
  color?: string;
  actionColor?: string;
}

export const HorizontalControls: React.FC<HorizontalControlsProps> = ({
  onLeft,
  onRight,
  onAction,
  actionLabel = 'FIRE',
  actionIcon = 'flame',
  color = COLORS.neonCyan,
  actionColor = COLORS.neonPink,
}) => {
  return (
    <View style={styles.horizontalControls}>
      <View style={styles.horizontalButtons}>
        <TouchableOpacity
          style={[styles.horizontalButton, { borderColor: color }]}
          onPress={onLeft}
          activeOpacity={0.7}
        >
          <Ionicons name="caret-back" size={32} color={color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.horizontalButton, { borderColor: color }]}
          onPress={onRight}
          activeOpacity={0.7}
        >
          <Ionicons name="caret-forward" size={32} color={color} />
        </TouchableOpacity>
      </View>
      
      <ActionButton
        label={actionLabel}
        icon={actionIcon}
        onPress={onAction}
        color={actionColor}
        size="lg"
      />
    </View>
  );
};

// Simple Jump Button
interface JumpButtonProps {
  onJump: () => void;
  color?: string;
  disabled?: boolean;
}

export const JumpButton: React.FC<JumpButtonProps> = ({
  onJump,
  color = COLORS.neonPink,
  disabled = false,
}) => {
  return (
    <View style={styles.jumpContainer}>
      <ActionButton
        label="JUMP"
        icon="arrow-up"
        onPress={onJump}
        color={color}
        size="lg"
        disabled={disabled}
      />
    </View>
  );
};

// Game Controls Container
interface GameControlsProps {
  children: React.ReactNode;
}

export const GameControls: React.FC<GameControlsProps> = ({ children }) => {
  return (
    <View style={styles.controlsContainer}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  dpadContainer: {
    alignItems: 'center',
  },
  dpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadButton: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  dpadCenter: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    margin: 2,
  },
  actionButton: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    marginTop: 2,
  },
  horizontalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  horizontalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  horizontalButton: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jumpContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  controlsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgDark,
    borderTopWidth: 2,
    borderTopColor: COLORS.neonPink + '40',
  },
});

export default {
  DPad,
  ActionButton,
  HorizontalControls,
  JumpButton,
  GameControls,
};
