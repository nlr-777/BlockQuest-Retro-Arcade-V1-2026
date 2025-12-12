// Block Quest Official - Pixel Button Component
import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PixelText } from './PixelText';
import { COLORS } from '../constants/colors';

interface PixelButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PixelButton: React.FC<PixelButtonProps> = ({
  title,
  onPress,
  color = COLORS.primary,
  textColor = COLORS.bgDark,
  size = 'md',
  disabled = false,
  style,
  icon,
}) => {
  const scale = useSharedValue(1);
  const borderOffset = useSharedValue(4);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    borderOffset.value = withTiming(2, { duration: 50 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    borderOffset.value = withTiming(4, { duration: 100 });
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: borderOffset.value },
      { translateY: borderOffset.value },
    ],
  }));

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 24 },
    lg: { paddingVertical: 16, paddingHorizontal: 32 },
  };

  const textSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={[styles.container, animatedContainerStyle, style]}
    >
      <Animated.View
        style={[
          styles.border,
          { backgroundColor: disabled ? COLORS.textMuted : color },
          animatedBorderStyle,
        ]}
      />
      <View
        style={[
          styles.button,
          sizeStyles[size],
          { backgroundColor: disabled ? COLORS.cardBg : color },
        ]}
      >
        {icon && (
          <PixelText size={textSizes[size]} color={textColor} style={{ marginRight: 8 }}>
            {icon}
          </PixelText>
        )}
        <PixelText size={textSizes[size]} color={textColor}>
          {title}
        </PixelText>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

export default PixelButton;
