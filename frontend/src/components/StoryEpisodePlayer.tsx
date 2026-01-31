// BlockQuest Official - Interactive Story Episode Player
// Comic-panel style story player with dialogue, choices, and Chaos Mode effects

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Text,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { COLORS } from '../constants/colors';
import { getCharacterById } from '../constants/characters';
import { 
  StoryEpisode, 
  StoryPanel, 
  StoryChoice,
  CHARACTER_EMOTIONS,
} from '../constants/storyEpisodes';
import { useGameStore } from '../store/gameStore';
import { FloatingSparkles, MegaConfetti, PressExplosion } from './ChaosEffects';
import audioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Character Portrait Component
// ============================================
const CharacterPortrait: React.FC<{
  characterId: string;
  emotion?: string;
  speaking?: boolean;
}> = ({ characterId, emotion = 'happy', speaking = false }) => {
  const character = getCharacterById(characterId);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (speaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      glowOpacity.value = withTiming(0.3);
    }
  }, [speaking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!character) return null;

  const emotionIcon = CHARACTER_EMOTIONS[emotion as keyof typeof CHARACTER_EMOTIONS] || '😊';

  return (
    <Animated.View style={[styles.portraitContainer, animatedStyle]}>
      <Animated.View 
        style={[
          styles.portraitGlow, 
          { backgroundColor: character.colors.primary },
          glowStyle
        ]} 
      />
      <View style={[styles.portrait, { borderColor: character.colors.primary }]}>
        <Text style={styles.portraitIcon}>{character.specialAbility.icon}</Text>
        <View style={[styles.emotionBubble, { backgroundColor: character.colors.primary }]}>
          <Text style={styles.emotionIcon}>{emotionIcon}</Text>
        </View>
      </View>
      <Text style={[styles.portraitName, { color: character.colors.primary }]}>
        {character.name}
      </Text>
    </Animated.View>
  );
};

// ============================================
// Dialogue Bubble Component
// ============================================
const DialogueBubble: React.FC<{
  text: string;
  characterId?: string;
  onComplete?: () => void;
}> = ({ text, characterId, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const character = characterId ? getCharacterById(characterId) : null;

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 30); // Typewriter speed

    return () => clearInterval(interval);
  }, [text]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIsComplete(true);
    onComplete?.();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.dialogueBubble,
        character && { borderColor: character.colors.primary + '60' }
      ]}
      onPress={handleSkip}
      activeOpacity={0.9}
    >
      <Text style={styles.dialogueText}>
        {displayedText}
        {!isComplete && <Text style={styles.cursor}>▌</Text>}
      </Text>
      {isComplete && (
        <Animated.Text 
          entering={FadeIn.duration(300)}
          style={styles.tapHint}
        >
          TAP TO CONTINUE ▶
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// Choice Button Component
// ============================================
const ChoiceButton: React.FC<{
  choice: StoryChoice;
  index: number;
  onSelect: (choice: StoryChoice) => void;
  disabled?: boolean;
  selected?: boolean;
}> = ({ choice, index, onSelect, disabled, selected }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
    audioManager.playSound('click');
    onSelect(choice);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D'];
  const buttonColor = colors[index % colors.length];

  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 150).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.choiceButton,
          { borderColor: buttonColor },
          selected && { backgroundColor: buttonColor + '30' },
          disabled && styles.choiceButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.choiceIndex}>{String.fromCharCode(65 + index)}</Text>
        <Text style={[styles.choiceText, disabled && styles.choiceTextDisabled]}>
          {choice.text}
        </Text>
        {choice.xpBonus && (
          <View style={[styles.xpBadge, { backgroundColor: buttonColor }]}>
            <Text style={styles.xpBadgeText}>+{choice.xpBonus} XP</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// Response Panel Component
// ============================================
const ResponsePanel: React.FC<{
  response: string;
  xpBonus?: number;
  isCorrect?: boolean;
  onContinue: () => void;
}> = ({ response, xpBonus, isCorrect, onContinue }) => {
  return (
    <Animated.View 
      entering={ZoomIn.springify()}
      style={styles.responsePanel}
    >
      {isCorrect && (
        <View style={styles.correctBadge}>
          <Text style={styles.correctText}>✨ GREAT ANSWER! ✨</Text>
        </View>
      )}
      <Text style={styles.responseText}>{response}</Text>
      {xpBonus && (
        <Animated.View 
          entering={BounceIn.delay(300)}
          style={styles.xpReward}
        >
          <Text style={styles.xpRewardText}>+{xpBonus} XP EARNED!</Text>
        </Animated.View>
      )}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueText}>CONTINUE ▶</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// Reveal Panel Component (Key Lessons)
// ============================================
const RevealPanel: React.FC<{
  text: string;
  onContinue: () => void;
}> = ({ text, onContinue }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  return (
    <View style={styles.revealContainer}>
      {showConfetti && (
        <MegaConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      )}
      <Animated.View 
        entering={ZoomIn.springify()}
        style={styles.revealPanel}
      >
        <View style={styles.revealGlow} />
        <Text style={styles.revealTitle}>🌟 KEY LESSON 🌟</Text>
        <Text style={styles.revealText}>{text.replace('💡 KEY LESSON: ', '')}</Text>
        <TouchableOpacity style={styles.revealButton} onPress={onContinue}>
          <Text style={styles.revealButtonText}>GOT IT! ✓</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================
// Main Story Episode Player
// ============================================
interface StoryEpisodePlayerProps {
  episode: StoryEpisode;
  visible: boolean;
  onClose: () => void;
  onComplete: (rewards: { xp: number; coins?: number; badge?: string }) => void;
}

export const StoryEpisodePlayer: React.FC<StoryEpisodePlayerProps> = ({
  episode,
  visible,
  onClose,
  onComplete,
}) => {
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isDialogueComplete, setIsDialogueComplete] = useState(false);

  const currentPanel = episode.panels[currentPanelIndex];
  const progress = ((currentPanelIndex + 1) / episode.panels.length) * 100;

  // Reset state when episode changes
  useEffect(() => {
    if (visible) {
      setCurrentPanelIndex(0);
      setSelectedChoice(null);
      setShowResponse(false);
      setEarnedXP(0);
      setIsDialogueComplete(false);
    }
  }, [visible, episode.id]);

  const handleNext = useCallback(() => {
    if (currentPanelIndex < episode.panels.length - 1) {
      setCurrentPanelIndex(prev => prev + 1);
      setSelectedChoice(null);
      setShowResponse(false);
      setIsDialogueComplete(false);
      audioManager.playSound('click');
    } else {
      // Episode complete!
      audioManager.playSound('powerup');
      onComplete({
        xp: episode.rewards.xp + earnedXP,
        coins: episode.rewards.coins,
        badge: episode.rewards.badge,
      });
    }
  }, [currentPanelIndex, episode, earnedXP, onComplete]);

  const handleChoiceSelect = (choice: StoryChoice) => {
    setSelectedChoice(choice);
    setShowResponse(true);
    if (choice.xpBonus) {
      setEarnedXP(prev => prev + choice.xpBonus!);
    }
    if (choice.isCorrect) {
      audioManager.playSound('powerup');
    } else {
      audioManager.playSound('click');
    }
  };

  const handleResponseContinue = () => {
    setShowResponse(false);
    handleNext();
  };

  const renderPanel = () => {
    if (!currentPanel) return null;

    switch (currentPanel.type) {
      case 'narration':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.narrationPanel}>
            <Text style={styles.narrationText}>{currentPanel.text}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>NEXT ▶</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'dialogue':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.dialoguePanel}>
            <CharacterPortrait 
              characterId={currentPanel.character!} 
              emotion={currentPanel.emotion}
              speaking={!isDialogueComplete}
            />
            <DialogueBubble 
              text={currentPanel.text}
              characterId={currentPanel.character}
              onComplete={() => setIsDialogueComplete(true)}
            />
            {isDialogueComplete && (
              <Animated.View entering={FadeIn.delay(200)}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>NEXT ▶</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        );

      case 'choice':
        if (showResponse && selectedChoice) {
          return (
            <ResponsePanel
              response={selectedChoice.response}
              xpBonus={selectedChoice.xpBonus}
              isCorrect={selectedChoice.isCorrect}
              onContinue={handleResponseContinue}
            />
          );
        }
        return (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.choicePanel}>
            <Text style={styles.choicePrompt}>{currentPanel.text}</Text>
            <View style={styles.choicesContainer}>
              {currentPanel.choices?.map((choice, index) => (
                <ChoiceButton
                  key={choice.id}
                  choice={choice}
                  index={index}
                  onSelect={handleChoiceSelect}
                  selected={selectedChoice?.id === choice.id}
                  disabled={selectedChoice !== null}
                />
              ))}
            </View>
          </Animated.View>
        );

      case 'reveal':
        return (
          <RevealPanel
            text={currentPanel.text}
            onContinue={handleNext}
          />
        );

      case 'action':
        return (
          <Animated.View entering={FadeIn.duration(500)} style={styles.actionPanel}>
            <Text style={styles.actionText}>{currentPanel.text}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentPanelIndex === episode.panels.length - 1 ? 'FINISH ✨' : 'NEXT ▶'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <FloatingSparkles count={15} colors={['#FFD700', '#00FF88', '#FF00FF', '#00D4FF']} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.episodeIcon}>{episode.icon}</Text>
            <Text style={styles.episodeTitle}>{episode.title}</Text>
          </View>
          <View style={styles.xpDisplay}>
            <Text style={styles.xpValue}>+{earnedXP}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentPanelIndex + 1} / {episode.panels.length}
          </Text>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {renderPanel()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.primary + '40',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: CRT_COLORS.textDim,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  episodeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  episodeTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  xpDisplay: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpValue: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  xpLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: CRT_COLORS.bgMedium,
  },
  progressBar: {
    height: 6,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // Portrait styles
  portraitContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  portraitGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.3,
  },
  portrait: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CRT_COLORS.bgMedium,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  portraitIcon: {
    fontSize: 36,
  },
  emotionBubble: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.bgDark,
  },
  emotionIcon: {
    fontSize: 14,
  },
  portraitName: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 8,
  },

  // Dialogue styles
  dialoguePanel: {
    alignItems: 'center',
  },
  dialogueBubble: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  dialogueText: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
  },
  cursor: {
    color: CRT_COLORS.primary,
  },
  tapHint: {
    fontSize: 10,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 12,
  },

  // Narration styles
  narrationPanel: {
    alignItems: 'center',
  },
  narrationText: {
    fontSize: 16,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },

  // Choice styles
  choicePanel: {
    width: '100%',
  },
  choicePrompt: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
  },
  choiceButtonDisabled: {
    opacity: 0.6,
  },
  choiceIndex: {
    fontSize: 16,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  choiceText: {
    flex: 1,
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  choiceTextDisabled: {
    color: CRT_COLORS.textDim,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  xpBadgeText: {
    fontSize: 10,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Response styles
  responsePanel: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
  },
  correctBadge: {
    backgroundColor: '#00FF88',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  correctText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  responseText: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  xpReward: {
    backgroundColor: COLORS.chainGold,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  xpRewardText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Reveal styles
  revealContainer: {
    alignItems: 'center',
  },
  revealPanel: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.chainGold,
    position: 'relative',
    overflow: 'hidden',
  },
  revealGlow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 100,
    backgroundColor: COLORS.chainGold,
    opacity: 0.2,
    borderRadius: 100,
  },
  revealTitle: {
    fontSize: 18,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  revealText: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  revealButton: {
    backgroundColor: COLORS.chainGold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  revealButtonText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Action styles
  actionPanel: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentCyan + '40',
  },
  actionText: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },

  // Next button
  nextButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

export default StoryEpisodePlayer;
