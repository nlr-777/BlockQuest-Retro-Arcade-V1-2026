// BlockQuest Official - Pixel Mascots
// 🎮 Four friendly guides who hint at concepts without naming them!

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { PixelText } from './PixelText';
import { COLORS } from '../constants/colors';

// Mascot Types
export type MascotType = 'blocky' | 'vaultie' | 'faction' | 'questie';

interface MascotProps {
  type: MascotType;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  mood?: 'happy' | 'excited' | 'thinking' | 'wink';
  showBubble?: boolean;
  animated?: boolean;
  onPress?: () => void;
}

// Mascot personalities and colors
const MASCOT_CONFIG = {
  blocky: {
    name: 'Blocky',
    color: '#00D4FF', // Cyan blue
    accent: '#0088AA',
    emoji: '🟦',
    shape: 'cube',
  },
  vaultie: {
    name: 'Vaultie',
    color: '#FFD700', // Gold
    accent: '#B8860B',
    emoji: '💎',
    shape: 'gem',
  },
  faction: {
    name: 'Unity',
    color: '#9B59B6', // Purple
    accent: '#6C3483',
    emoji: '⬡',
    shape: 'hexagon',
  },
  questie: {
    name: 'Questie',
    color: '#2ECC71', // Green
    accent: '#1D8348',
    emoji: '⭐',
    shape: 'star',
  },
};

// Blocky - The Blue Cube (Main Guide)
const BlockyMascot: React.FC<{ size: number; mood: string }> = ({ size, mood }) => {
  const bounce = useSharedValue(0);
  const blink = useSharedValue(1);
  
  useEffect(() => {
    // Bouncing animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );
    
    // Blinking animation
    const blinkInterval = setInterval(() => {
      blink.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }, 3000 + Math.random() * 2000);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  
  const eyeSize = size * 0.15;
  const mouthWidth = size * 0.3;
  
  return (
    <Animated.View style={[styles.mascotContainer, { width: size, height: size }, animatedStyle]}>
      {/* Body - Blue Cube */}
      <View style={[styles.blockyBody, { 
        width: size * 0.8, 
        height: size * 0.8,
        borderRadius: size * 0.15,
        backgroundColor: MASCOT_CONFIG.blocky.color,
        borderWidth: 3,
        borderColor: MASCOT_CONFIG.blocky.accent,
      }]}>
        {/* Highlight */}
        <View style={[styles.highlight, { 
          width: size * 0.2, 
          height: size * 0.2,
          borderRadius: size * 0.05,
          top: size * 0.1,
          left: size * 0.1,
        }]} />
        
        {/* Eyes */}
        <View style={styles.eyesContainer}>
          <Animated.View style={[styles.eye, { 
            width: eyeSize, 
            height: eyeSize * 1.2,
            borderRadius: eyeSize * 0.3,
          }, eyeStyle]} />
          <Animated.View style={[styles.eye, { 
            width: eyeSize, 
            height: eyeSize * 1.2,
            borderRadius: eyeSize * 0.3,
          }, eyeStyle]} />
        </View>
        
        {/* Mouth */}
        <View style={[
          mood === 'excited' ? styles.mouthExcited : styles.mouthHappy,
          { width: mouthWidth, height: mood === 'excited' ? mouthWidth * 0.5 : 4 }
        ]} />
      </View>
      
      {/* Little feet */}
      <View style={styles.feetContainer}>
        <View style={[styles.foot, { backgroundColor: MASCOT_CONFIG.blocky.accent }]} />
        <View style={[styles.foot, { backgroundColor: MASCOT_CONFIG.blocky.accent }]} />
      </View>
    </Animated.View>
  );
};

// Vaultie - The Golden Gem (Vault Guide)
const VaultieMascot: React.FC<{ size: number; mood: string }> = ({ size, mood }) => {
  const sparkle = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  useEffect(() => {
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000 }),
        withTiming(5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }, { rotate: `${rotate.value}deg` }],
  }));
  
  return (
    <Animated.View style={[styles.mascotContainer, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.gemBody, { 
        width: size * 0.7,
        height: size * 0.8,
        backgroundColor: MASCOT_CONFIG.vaultie.color,
        borderColor: MASCOT_CONFIG.vaultie.accent,
      }]}>
        {/* Sparkle */}
        <View style={[styles.sparkle, { top: size * 0.1, right: size * 0.15 }]}>
          <PixelText size="xs" color="#FFF">✨</PixelText>
        </View>
        
        {/* Eyes */}
        <View style={[styles.eyesContainer, { marginTop: size * 0.15 }]}>
          <View style={[styles.eye, { width: size * 0.12, height: size * 0.15 }]} />
          <View style={[styles.eye, { width: size * 0.12, height: size * 0.15 }]} />
        </View>
        
        {/* Mouth */}
        <View style={[styles.mouthHappy, { width: size * 0.25 }]} />
      </View>
    </Animated.View>
  );
};

// Unity - The Purple Hexagon (Faction Guide)
const UnityMascot: React.FC<{ size: number; mood: string }> = ({ size, mood }) => {
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  
  return (
    <Animated.View style={[styles.mascotContainer, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.hexBody, { 
        width: size * 0.75,
        height: size * 0.75,
        backgroundColor: MASCOT_CONFIG.faction.color,
        borderColor: MASCOT_CONFIG.faction.accent,
      }]}>
        {/* Eyes */}
        <View style={[styles.eyesContainer, { marginTop: size * 0.1 }]}>
          <View style={[styles.eye, { width: size * 0.1, height: size * 0.12 }]} />
          <View style={[styles.eye, { width: size * 0.1, height: size * 0.12 }]} />
        </View>
        
        {/* Smile */}
        <View style={[styles.mouthHappy, { width: size * 0.2 }]} />
        
        {/* Connection dots */}
        <View style={styles.connectionDots}>
          <View style={[styles.dot, { backgroundColor: '#FFF' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFF' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFF' }]} />
        </View>
      </View>
    </Animated.View>
  );
};

// Questie - The Green Star (Game Guide)
const QuestieMascot: React.FC<{ size: number; mood: string }> = ({ size, mood }) => {
  const spin = useSharedValue(0);
  const jump = useSharedValue(0);
  
  useEffect(() => {
    jump.value = withRepeat(
      withSequence(
        withSpring(-8, { damping: 4 }),
        withSpring(0, { damping: 4 })
      ),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: jump.value }],
  }));
  
  return (
    <Animated.View style={[styles.mascotContainer, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.starBody, { 
        width: size * 0.8,
        height: size * 0.8,
      }]}>
        <PixelText size="xl" style={{ fontSize: size * 0.6 }}>⭐</PixelText>
        {/* Face overlay */}
        <View style={styles.starFace}>
          <View style={styles.eyesContainer}>
            <View style={[styles.eye, { width: size * 0.08, height: size * 0.1 }]} />
            <View style={[styles.eye, { width: size * 0.08, height: size * 0.1 }]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Speech Bubble Component
const SpeechBubble: React.FC<{ message: string; position?: 'top' | 'bottom' }> = ({ 
  message, 
  position = 'top' 
}) => {
  const fadeIn = useSharedValue(0);
  
  useEffect(() => {
    fadeIn.value = withSpring(1, { damping: 12 });
  }, [message]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: fadeIn.value }],
  }));
  
  return (
    <Animated.View style={[
      styles.speechBubble, 
      position === 'bottom' && styles.speechBubbleBottom,
      animatedStyle
    ]}>
      <PixelText size="xs" color={COLORS.textBright} style={styles.speechText}>
        {message}
      </PixelText>
      <View style={[
        styles.speechTail,
        position === 'bottom' && styles.speechTailBottom
      ]} />
    </Animated.View>
  );
};

// Main Mascot Component
export const Mascot: React.FC<MascotProps> = ({
  type,
  size = 'md',
  message,
  mood = 'happy',
  showBubble = true,
  animated = true,
}) => {
  const sizeMap = { sm: 48, md: 64, lg: 96 };
  const pixelSize = sizeMap[size];
  
  const renderMascot = () => {
    switch (type) {
      case 'blocky':
        return <BlockyMascot size={pixelSize} mood={mood} />;
      case 'vaultie':
        return <VaultieMascot size={pixelSize} mood={mood} />;
      case 'faction':
        return <UnityMascot size={pixelSize} mood={mood} />;
      case 'questie':
        return <QuestieMascot size={pixelSize} mood={mood} />;
      default:
        return <BlockyMascot size={pixelSize} mood={mood} />;
    }
  };
  
  return (
    <View style={styles.wrapper}>
      {message && showBubble && <SpeechBubble message={message} />}
      {renderMascot()}
    </View>
  );
};

// Blocky's hint messages (no blockchain terminology!)
export const BLOCKY_HINTS = {
  welcome: [
    "Hey! I'm Blocky! Let's play some games! 🎮",
    "Each game has secrets to discover...",
    "The more you play, the stronger you get!",
  ],
  vault: [
    "This is YOUR collection! No one else has the same one!",
    "Rare stuff is... well, RARE! That makes it special!",
    "Your badges give you powers in games!",
  ],
  factions: [
    "Teams are stronger together!",
    "Vote with your team to change things!",
    "Help your team's treasure grow!",
  ],
  games: [
    "Ready to play? Pick a game!",
    "High scores = more rewards!",
    "Try 'em all to unlock secrets!",
  ],
  rewards: [
    "Nice score! Here's your reward!",
    "Your team gets bonus points too!",
    "Keep playing to level up!",
  ],
};

// Get random hint from category
export const getRandomHint = (category: keyof typeof BLOCKY_HINTS): string => {
  const hints = BLOCKY_HINTS[category];
  return hints[Math.floor(Math.random() * hints.length)];
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockyBody: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eye: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
  },
  mouthHappy: {
    height: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    marginTop: 4,
  },
  mouthExcited: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    marginTop: 4,
  },
  feetContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -2,
  },
  foot: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
  gemBody: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  sparkle: {
    position: 'absolute',
  },
  hexBody: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: 12,
  },
  connectionDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  starBody: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  starFace: {
    position: 'absolute',
    top: '35%',
  },
  speechBubble: {
    backgroundColor: COLORS.bgMedium,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    maxWidth: 200,
    position: 'relative',
  },
  speechBubbleBottom: {
    marginBottom: 0,
    marginTop: 8,
  },
  speechText: {
    textAlign: 'center',
    lineHeight: 16,
  },
  speechTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
  speechTailBottom: {
    bottom: 'auto',
    top: -8,
    borderTopWidth: 0,
    borderBottomWidth: 8,
    borderBottomColor: COLORS.primary,
  },
});

export default Mascot;
