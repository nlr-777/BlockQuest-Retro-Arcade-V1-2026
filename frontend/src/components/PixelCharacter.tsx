// PixelCharacter.tsx - Programmatic pixel art character sprites
// Web3 Chaos Chronicles characters rendered as retro pixel art
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

// Pixel grid size (each character is an 8x12 or 10x14 grid)
const PIXEL_SIZE = 4;

// Character color palettes
const CHARACTER_PALETTES = {
  zara: {
    hair: '#6A0DAD',
    hairLight: '#9D4EDD',
    skin: '#F4C7A0',
    eyes: '#C77DFF',
    glasses: '#FFFFFF',
    hoodie: '#7B2CBF',
    hoodieLight: '#9D4EDD',
    pants: '#2D1B69',
    shoes: '#1A0A42',
    accent: '#C77DFF',
  },
  sam: {
    hair: '#3D2B1F',
    hairLight: '#5C4033',
    skin: '#D4A574',
    eyes: '#FF7F50',
    shirt: '#FF7F50',
    shirtPattern: '#FFFFFF',
    pants: '#2C3E50',
    shoes: '#1A1A2E',
    accent: '#FFA07A',
  },
  miko: {
    hair: '#1A1A2E',
    hairLight: '#2D2D4E',
    bun: '#1A1A2E',
    skin: '#F5DEB3',
    eyes: '#00CED1',
    jacket: '#4682B4',
    jacketLight: '#5B9BD5',
    shirt: '#FFFFFF',
    pants: '#2C3E50',
    shoes: '#1A1A2E',
    accent: '#40E0D0',
  },
  ollie: {
    hair: '#1A1A1A',
    hairLight: '#333333',
    skin: '#8B6914',
    skinLight: '#A67C00',
    eyes: '#32CD32',
    hoodie: '#228B22',
    hoodieLight: '#32CD32',
    headphones: '#7CFC00',
    headphonesBand: '#228B22',
    pants: '#2C3E50',
    shoes: '#1A1A2E',
    accent: '#7CFC00',
  },
  lila: {
    hair: '#3D2B1F',
    hairLight: '#5C4033',
    skin: '#F5DEB3',
    eyes: '#FFD700',
    cardigan: '#FFD700',
    cardiganLight: '#FFEC8B',
    shirt: '#FFFFFF',
    pants: '#2C3E50',
    shoes: '#DAA520',
    accent: '#FFEC8B',
  },
  collective: {
    glow1: '#BF00FF',
    glow2: '#9400D3',
    glow3: '#DA70D6',
    core: '#FFFFFF',
    ring1: '#9D4EDD',
    ring2: '#FF7F50',
    ring3: '#00CED1',
    ring4: '#32CD32',
    ring5: '#FFD700',
  },
};

// Pixel art sprite data for each character (row by row, 10 columns x 14 rows)
// 0 = transparent, 1-9 = palette index
const SPRITE_DATA: Record<string, number[][]> = {
  zara: [
    // Row 0: Hair top
    [0,0,0,1,1,1,1,0,0,0],
    // Row 1: Hair with purple streaks
    [0,0,1,2,1,1,2,1,0,0],
    // Row 2: Face top + glasses
    [0,0,3,4,3,3,4,3,0,0],
    // Row 3: Face + eyes
    [0,0,3,5,3,3,5,3,0,0],
    // Row 4: Face bottom
    [0,0,0,3,3,3,3,0,0,0],
    // Row 5: Hoodie collar
    [0,0,6,7,7,7,7,6,0,0],
    // Row 6: Hoodie body
    [0,6,6,7,7,7,7,6,6,0],
    // Row 7: Hoodie body + arms
    [6,6,6,7,7,7,7,6,6,6],
    // Row 8: Hoodie bottom
    [0,6,6,7,7,7,7,6,6,0],
    // Row 9: Hoodie hem
    [0,0,6,6,6,6,6,6,0,0],
    // Row 10: Pants
    [0,0,8,8,0,0,8,8,0,0],
    // Row 11: Pants
    [0,0,8,8,0,0,8,8,0,0],
    // Row 12: Shoes
    [0,9,9,9,0,0,9,9,9,0],
    // Row 13: Shoes bottom
    [0,9,9,9,0,0,9,9,9,0],
  ],
  sam: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,2,2,1,1,0,0],
    [0,0,3,3,3,3,3,3,0,0],
    [0,0,3,4,3,3,4,3,0,0],
    [0,0,0,3,3,3,3,0,0,0],
    [0,0,5,6,5,5,6,5,0,0],
    [0,5,5,6,5,5,6,5,5,0],
    [5,5,5,6,5,5,6,5,5,5],
    [0,5,5,5,5,5,5,5,5,0],
    [0,0,5,5,5,5,5,5,0,0],
    [0,0,7,7,0,0,7,7,0,0],
    [0,0,7,7,0,0,7,7,0,0],
    [0,8,8,8,0,0,8,8,8,0],
    [0,8,8,8,0,0,8,8,8,0],
  ],
  miko: [
    [0,0,0,1,1,1,1,0,2,0],
    [0,0,1,1,1,1,1,1,2,0],
    [0,0,3,3,3,3,3,3,0,0],
    [0,0,3,4,3,3,4,3,0,0],
    [0,0,0,3,3,3,3,0,0,0],
    [0,0,5,6,7,7,6,5,0,0],
    [0,5,5,6,7,7,6,5,5,0],
    [5,5,5,6,7,7,6,5,5,5],
    [0,5,5,5,7,7,5,5,5,0],
    [0,0,5,5,5,5,5,5,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,9,9,9,0,0,9,9,9,0],
    [0,9,9,9,0,0,9,9,9,0],
  ],
  ollie: [
    [0,5,0,1,1,1,1,0,5,0],
    [0,6,1,1,2,2,1,1,6,0],
    [0,0,3,3,3,3,3,3,0,0],
    [0,0,4,5,4,4,5,4,0,0],
    [0,0,0,3,3,3,3,0,0,0],
    [0,0,6,7,7,7,7,6,0,0],
    [0,6,6,7,7,7,7,6,6,0],
    [6,6,6,7,7,7,7,6,6,6],
    [0,6,6,7,7,7,7,6,6,0],
    [0,0,6,6,6,6,6,6,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,9,9,9,0,0,9,9,9,0],
    [0,9,9,9,0,0,9,9,9,0],
  ],
  lila: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,2,2,1,1,0,0],
    [0,0,3,3,3,3,3,3,0,0],
    [0,0,3,4,3,3,4,3,0,0],
    [0,0,0,3,3,3,3,0,0,0],
    [0,0,5,6,7,7,6,5,0,0],
    [0,5,5,6,7,7,6,5,5,0],
    [5,5,5,6,7,7,6,5,5,5],
    [0,5,5,5,7,7,5,5,5,0],
    [0,0,5,5,5,5,5,5,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,0,8,8,0,0,8,8,0,0],
    [0,9,9,9,0,0,9,9,9,0],
    [0,9,9,9,0,0,9,9,9,0],
  ],
};

// Map palette index to actual color
function getPixelColor(characterId: string, index: number): string | null {
  if (index === 0) return null;
  const palette = CHARACTER_PALETTES[characterId as keyof typeof CHARACTER_PALETTES];
  if (!palette) return null;
  
  const colorKeys = Object.keys(palette);
  if (index > 0 && index <= colorKeys.length) {
    return (palette as any)[colorKeys[index - 1]];
  }
  return null;
}

interface PixelCharacterProps {
  characterId: string;
  size?: number; // Scale multiplier (1 = 4px per pixel, 2 = 8px, etc.)
  animate?: boolean;
  glowColor?: string;
  style?: any;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  characterId,
  size = 1,
  animate = false,
  glowColor,
  style,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    if (animate) {
      // Idle bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -4 * size,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, size]);
  
  const sprite = SPRITE_DATA[characterId];
  if (!sprite) return null;
  
  const pixelSize = PIXEL_SIZE * size;
  const charWidth = 10 * pixelSize;
  const charHeight = 14 * pixelSize;
  
  const resolvedGlowColor = glowColor || 
    (CHARACTER_PALETTES[characterId as keyof typeof CHARACTER_PALETTES] as any)?.accent || '#FFFFFF';
  
  return (
    <Animated.View style={[
      {
        width: charWidth,
        height: charHeight,
        transform: [{ translateY: animate ? bounceAnim : 0 }],
      },
      style,
    ]}>
      {/* Glow effect behind character */}
      {glowColor && (
        <Animated.View style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          right: '10%',
          bottom: '10%',
          borderRadius: charWidth / 3,
          backgroundColor: resolvedGlowColor,
          opacity: glowAnim,
          // Using boxShadow for glow effect
        }} />
      )}
      
      {/* Pixel grid */}
      {sprite.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row' }}>
          {row.map((pixel, colIdx) => {
            const color = getPixelColor(characterId, pixel);
            return (
              <View
                key={`${rowIdx}-${colIdx}`}
                style={{
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: color || 'transparent',
                }}
              />
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
};

// Collective character - animated multi-color pixel constellation
export const PixelCollective: React.FC<{
  size?: number;
  animate?: boolean;
  style?: any;
}> = ({ size = 1, animate = true, style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  
  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate]);
  
  const pixelSize = PIXEL_SIZE * size;
  const charSize = 12 * pixelSize;
  const palette = CHARACTER_PALETTES.collective;
  
  // 5 character dots in a pentagon + center
  const dots = [
    { x: 5, y: 1, color: palette.ring1 },   // Zara top
    { x: 9, y: 4, color: palette.ring2 },   // Sam right
    { x: 8, y: 9, color: palette.ring3 },   // Miko bottom-right
    { x: 2, y: 9, color: palette.ring4 },   // Ollie bottom-left
    { x: 1, y: 4, color: palette.ring5 },   // Lila left
    { x: 5, y: 5, color: palette.core },    // Center
  ];
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.View style={[
      {
        width: charSize,
        height: charSize,
        transform: [{ rotate: animate ? spin : '0deg' }],
      },
      style,
    ]}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: dot.x * pixelSize,
            top: dot.y * pixelSize,
            width: pixelSize * (i === 5 ? 2 : 1.5),
            height: pixelSize * (i === 5 ? 2 : 1.5),
            backgroundColor: dot.color,
            borderRadius: pixelSize,
            opacity: i === 5 ? 1 : pulseAnim,
          }}
        />
      ))}
    </Animated.View>
  );
};

// Character pixel portrait with frame
interface PixelPortraitProps {
  characterId: string;
  size?: number;
  showGlow?: boolean;
  frameColor?: string;
  style?: any;
}

export const PixelPortrait: React.FC<PixelPortraitProps> = ({
  characterId,
  size = 2,
  showGlow = true,
  frameColor,
  style,
}) => {
  const palette = CHARACTER_PALETTES[characterId as keyof typeof CHARACTER_PALETTES];
  const resolvedFrame = frameColor || (palette as any)?.accent || '#FFFFFF';
  
  if (characterId === 'collective') {
    return (
      <View style={[styles.portrait, { borderColor: resolvedFrame }, style]}>
        <PixelCollective size={size} animate={showGlow} />
      </View>
    );
  }
  
  return (
    <View style={[
      styles.portrait,
      { 
        borderColor: resolvedFrame,
        backgroundColor: resolvedFrame + '15',
      },
      style,
    ]}>
      <PixelCharacter
        characterId={characterId}
        size={size}
        animate={showGlow}
        glowColor={showGlow ? resolvedFrame : undefined}
      />
    </View>
  );
};

// Mini pixel character for game HUDs
export const MiniPixelCharacter: React.FC<{
  characterId: string;
  style?: any;
}> = ({ characterId, style }) => {
  if (characterId === 'collective') {
    return <PixelCollective size={0.75} animate={false} style={style} />;
  }
  return (
    <PixelCharacter
      characterId={characterId}
      size={0.75}
      animate={false}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  portrait: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { CHARACTER_PALETTES };
export default PixelCharacter;
