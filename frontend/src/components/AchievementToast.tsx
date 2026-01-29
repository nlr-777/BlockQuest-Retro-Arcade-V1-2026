// BlockQuest Official - Achievement Toast Component
// Celebratory popup when achievements are earned

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  FadeIn,
  FadeOut,
  SlideInUp,
  ZoomIn,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { useAccessibilityStore } from '../utils/accessibility';
import { getCharacterById } from '../constants/characters';
import { useCharacterStore } from '../store/characterStore';
import { StoryAchievement, getAchievementRarityColor } from '../services/StoryAchievements';
import audioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AchievementToastProps {
  achievement: StoryAchievement | null;
  visible: boolean;
  onDismiss: () => void;
  autoDismiss?: number; // ms to auto dismiss
}

// Sparkle particle component
const Sparkle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue((Math.random() - 0.5) * 100);
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    ));
    scale.value = withDelay(delay, withSequence(
      withSpring(1.2),
      withTiming(0, { duration: 800 })
    ));
    translateY.value = withDelay(delay, withTiming(-80 - Math.random() * 40, { duration: 1000 }));
    rotation.value = withDelay(delay, withTiming(360, { duration: 1000 }));
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  return (
    <Animated.View style={[sparkleStyles.sparkle, animatedStyle]}>
      <Text style={[sparkleStyles.sparkleText, { color }]}>✦</Text>
    </Animated.View>
  );
};

const sparkleStyles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    bottom: '50%',
  },
  sparkleText: {
    fontSize: 16,
  },
});

// Confetti burst component
const ConfettiBurst: React.FC<{ color: string }> = ({ color }) => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 50,
  }));
  
  return (
    <View style={confettiStyles.container}>
      {particles.map((particle) => (
        <Sparkle key={particle.id} delay={particle.delay} color={color} />
      ))}
    </View>
  );
};

const confettiStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});

// Main Achievement Toast
export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  visible,
  onDismiss,
  autoDismiss = 4000,
}) => {
  const { reduceMotion } = useAccessibilityStore();
  const { selectedCharacterId, getSelectedCharacter } = useCharacterStore();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const scale = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  
  const selectedCharacter = getSelectedCharacter();
  const rarityColor = achievement ? getAchievementRarityColor(achievement.rarity) : CRT_COLORS.primary;
  
  // Character congratulations messages
  const getCongratsMessage = () => {
    if (!selectedCharacter) return "Amazing work!";
    
    const messages: Record<string, string[]> = {
      'zara': [
        "Code executed perfectly! 💻",
        "Achievement unlocked in record time!",
        "Your skills are compiling nicely!",
      ],
      'kira': [
        "The blockchain recognizes your worth! ⛓️",
        "Another block added to your legacy!",
        "Decentralized awesomeness!",
      ],
      'rex': [
        "LEGENDARY achievement! 🎮",
        "High score material right there!",
        "You're on fire! Keep gaming!",
      ],
      'nova': [
        "Stellar performance! ⭐",
        "The cosmos smile upon you!",
        "Your potential is limitless!",
      ],
      'max': [
        "Shield upgraded! 🛡️",
        "Your defenses grow stronger!",
        "Secure and successful!",
      ],
    };
    
    const charMessages = messages[selectedCharacter.id] || messages['zara'];
    return charMessages[Math.floor(Math.random() * charMessages.length)];
  };
  
  useEffect(() => {
    if (visible && achievement) {
      // Play notification sound (distinct, doesn't overlap with game sounds)
      audioManager.playSound('notification');
      
      if (!reduceMotion) {
        // Entry animation
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });
        
        // Icon bounce
        iconScale.value = withDelay(300, withSequence(
          withSpring(1.3),
          withSpring(1)
        ));
        
        // Glow pulse
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.5, { duration: 500 })
          ),
          -1,
          true
        );
        
        // Show confetti
        setShowConfetti(true);
      } else {
        scale.value = 1;
      }
      
      // Auto dismiss
      if (autoDismiss > 0) {
        const timer = setTimeout(() => {
          onDismiss();
        }, autoDismiss);
        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      setShowConfetti(false);
    }
  }, [visible, achievement, autoDismiss, reduceMotion]);
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  if (!achievement) return null;
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onDismiss}
      >
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Confetti effect */}
          {showConfetti && !reduceMotion && (
            <ConfettiBurst color={rarityColor} />
          )}
          
          {/* Glow background */}
          <Animated.View 
            style={[
              styles.glowBg, 
              { backgroundColor: rarityColor },
              glowStyle
            ]} 
          />
          
          {/* Content card */}
          <View style={[styles.card, { borderColor: rarityColor }]}>
            {/* Achievement unlocked header */}
            <View style={[styles.header, { backgroundColor: rarityColor + '30' }]}>
              <Text style={styles.headerText}>🎉 ACHIEVEMENT UNLOCKED!</Text>
            </View>
            
            {/* Icon */}
            <Animated.View style={[styles.iconContainer, iconStyle]}>
              <View style={[styles.iconBg, { backgroundColor: rarityColor + '30', borderColor: rarityColor }]}>
                <Text style={styles.icon}>{achievement.icon}</Text>
              </View>
            </Animated.View>
            
            {/* Achievement info */}
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            
            {/* Rarity badge */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20', borderColor: rarityColor }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
            
            {/* Reward info */}
            {achievement.reward && (
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>REWARD:</Text>
                <Text style={[styles.rewardValue, { color: CRT_COLORS.accentGold }]}>
                  +{achievement.reward.value} {achievement.reward.type.toUpperCase()}
                </Text>
              </View>
            )}
            
            {/* Character message */}
            {selectedCharacter && (
              <View style={[styles.characterMessage, { borderColor: selectedCharacter.colors.primary + '40' }]}>
                <Text style={styles.characterIcon}>{selectedCharacter.specialAbility.icon}</Text>
                <View style={styles.messageBubble}>
                  <Text style={[styles.characterName, { color: selectedCharacter.colors.primary }]}>
                    {selectedCharacter.name}
                  </Text>
                  <Text style={styles.messageText}>{getCongratsMessage()}</Text>
                </View>
              </View>
            )}
            
            {/* Tap to continue */}
            <Text style={styles.tapText}>TAP TO CONTINUE</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
  },
  glowBg: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
    opacity: 0.3,
  },
  card: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  name: {
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  rarityBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  rarityText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  rewardLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rewardValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  characterMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  characterIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  messageBubble: {
    flex: 1,
  },
  characterName: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  tapText: {
    fontSize: 10,
    color: CRT_COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    letterSpacing: 1,
  },
});

// Export a hook for managing achievement toasts
export const useAchievementToast = () => {
  const [currentAchievement, setCurrentAchievement] = useState<StoryAchievement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [queue, setQueue] = useState<StoryAchievement[]>([]);
  
  const showAchievement = (achievement: StoryAchievement) => {
    if (isVisible) {
      // Add to queue if already showing
      setQueue(prev => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
      setIsVisible(true);
    }
  };
  
  const showMultipleAchievements = (achievements: StoryAchievement[]) => {
    if (achievements.length === 0) return;
    
    const [first, ...rest] = achievements;
    setCurrentAchievement(first);
    setIsVisible(true);
    setQueue(rest);
  };
  
  const dismiss = () => {
    setIsVisible(false);
    
    // Show next in queue after brief delay
    setTimeout(() => {
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        setCurrentAchievement(next);
        setQueue(rest);
        setIsVisible(true);
      } else {
        setCurrentAchievement(null);
      }
    }, 300);
  };
  
  return {
    currentAchievement,
    isVisible,
    showAchievement,
    showMultipleAchievements,
    dismiss,
    queueLength: queue.length,
  };
};

export default AchievementToast;
