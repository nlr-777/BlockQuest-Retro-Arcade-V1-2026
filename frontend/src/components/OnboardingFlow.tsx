// BlockQuest - Onboarding Flow Component
// First-time user experience and tutorial

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CRT_COLORS } from '../constants/crtTheme';
import { COLORS } from '../constants/colors';
import PixelText from './PixelText';
import * as Haptics from 'expo-haptics';
import audioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = 'blockquest_onboarding_complete';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BlockQuest!',
    description: 'Learn blockchain concepts through fun retro games. No crypto knowledge needed!',
    emoji: '🎮',
    highlight: 'Kid-safe • Educational • Fun',
  },
  {
    id: 'heroes',
    title: 'Choose Your Hero',
    description: 'Each hero has unique abilities and bonuses. Unlock more by playing games!',
    emoji: '⚡',
    highlight: '5 unique heroes to unlock',
  },
  {
    id: 'games',
    title: 'Play 15+ Mini Games',
    description: 'Each game teaches a different blockchain concept - from hashing to smart contracts!',
    emoji: '🕹️',
    highlight: 'Earn XP & badges',
  },
  {
    id: 'story',
    title: 'Unlock the Story',
    description: 'Master games to unlock chapters of the Web3 Chaos Chronicles adventure!',
    emoji: '📖',
    highlight: '5 books • 15 chapters',
  },
  {
    id: 'rewards',
    title: 'Daily Rewards',
    description: 'Log in daily to build streaks and earn bonus XP, coins, and special items!',
    emoji: '🔥',
    highlight: 'Streak bonuses up to 70%',
  },
  {
    id: 'ready',
    title: "You're Ready!",
    description: 'Start your blockchain education adventure. Have fun and learn something new!',
    emoji: '🚀',
    highlight: 'Let\'s go!',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const progress = useSharedValue(0);
  const emojiScale = useSharedValue(1);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / ONBOARDING_STEPS.length, { duration: 300 });
    emojiScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, { damping: 10 })
    );
  }, [currentStep]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setVisible(true);
      } else {
        onComplete();
      }
    } catch (error) {
      setVisible(true);
    }
  };

  const handleNext = () => {
    // Play navigation sound
    audioManager.playSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Play victory sound when completing onboarding
      audioManager.playSound('victory');
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    audioManager.playSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {}
    setVisible(false);
    onComplete();
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>

          {/* Skip button */}
          {currentStep < ONBOARDING_STEPS.length - 1 && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <PixelText size="xs" color={CRT_COLORS.textDim}>SKIP</PixelText>
            </TouchableOpacity>
          )}

          {/* Content */}
          <Animated.View 
            key={step.id}
            entering={SlideInRight.duration(300)}
            style={styles.content}
          >
            <Animated.View style={[styles.emojiContainer, emojiStyle]}>
              <PixelText size="xxl">{step.emoji}</PixelText>
            </Animated.View>

            <PixelText size="lg" color={CRT_COLORS.primary} style={styles.title}>
              {step.title}
            </PixelText>

            <PixelText size="sm" color={CRT_COLORS.textBright} style={styles.description}>
              {step.description}
            </PixelText>

            {step.highlight && (
              <View style={styles.highlightBox}>
                <PixelText size="xs" color={CRT_COLORS.accentGold}>
                  {step.highlight}
                </PixelText>
              </View>
            )}
          </Animated.View>

          {/* Dots indicator */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                  index < currentStep && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Next button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <PixelText size="md" color="#000">
              {currentStep === ONBOARDING_STEPS.length - 1 ? "🚀 START PLAYING" : "NEXT →"}
            </PixelText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Hook to check if onboarding is needed
export const useOnboardingStatus = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        setNeedsOnboarding(!completed);
      } catch (error) {
        setNeedsOnboarding(true);
      }
    };
    check();
  }, []);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setNeedsOnboarding(true);
  };

  return { needsOnboarding, resetOnboarding };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  highlightBox: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CRT_COLORS.bgMedium,
  },
  dotActive: {
    backgroundColor: CRT_COLORS.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: CRT_COLORS.textDim,
  },
  nextButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
});

export default OnboardingFlow;
