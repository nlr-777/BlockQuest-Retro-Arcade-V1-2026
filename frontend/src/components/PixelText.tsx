// Block Quest Official - Pixel Text Component
import React from 'react';
import { Text, StyleSheet, TextStyle, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

interface PixelTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  color?: string;
  glow?: boolean;
  style?: TextStyle;
}

const SIZES = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const PixelText: React.FC<PixelTextProps> = ({
  children,
  size = 'md',
  color = COLORS.textPrimary,
  glow = false,
  style,
}) => {
  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: SIZES[size],
          color,
          textShadowColor: glow ? color : 'transparent',
          textShadowOffset: glow ? { width: 0, height: 0 } : { width: 0, height: 0 },
          textShadowRadius: glow ? 10 : 0,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PixelText;
