// BlockQuest Official - Story Badges Section
// Uniquely rare badge achievements with mini quizzes from the book series

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Modal,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { COLORS } from '../constants/colors';
import { 
  STORY_BADGES, 
  StoryBadge, 
  RARITY_COLORS,
  getStoryBadgeById,
} from '../constants/storyBadges';
import { useGameStore } from '../store/gameStore';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_CARD_WIDTH = (SCREEN_WIDTH - 64) / 2;

// Animated badge card component
const StoryBadgeCard: React.FC<{
  badge: StoryBadge;
  isUnlocked: boolean;
  onPress: () => void;
  index: number;
}> = ({ badge, isUnlocked, onPress, index }) => {
  const glowOpacity = useSharedValue(0.5);
  const rarityColor = RARITY_COLORS[badge.rarity];

  useEffect(() => {
    if (isUnlocked) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isUnlocked]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        style={[
          styles.badgeCard,
          { borderColor: isUnlocked ? rarityColor : CRT_COLORS.bgMedium },
          !isUnlocked && styles.badgeCardLocked,
        ]}
        onPress={onPress}
        role="button"
      >
        {/* Glow effect for unlocked badges */}
        {isUnlocked && (
          <Animated.View
            style={[
              styles.badgeGlow,
              { backgroundColor: rarityColor },
              glowStyle,
            ]}
          />
        )}

        {/* Badge Image */}
        <View style={styles.badgeImageContainer}>
          {isUnlocked ? (
            <Image
              source={{ uri: badge.imageUrl }}
              style={styles.badgeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.lockedImagePlaceholder}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.quizText}>QUIZ</Text>
            </View>
          )}
        </View>

        {/* Rarity Badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>{badge.rarity.toUpperCase()}</Text>
        </View>

        {/* Badge Info */}
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeTitle, { color: isUnlocked ? rarityColor : CRT_COLORS.textDim }]} numberOfLines={1}>
            {badge.title}
          </Text>
          <Text style={styles.bookLabel}>Book {badge.bookNumber}</Text>
          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>+{badge.xpReward} XP</Text>
          </View>
        </View>

        {/* Action hint */}
        <View style={styles.actionHint}>
          <Text style={[styles.actionText, { color: isUnlocked ? '#00FF88' : rarityColor }]}>
            {isUnlocked ? '✓ UNLOCKED' : 'TAP TO QUIZ'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Quiz Modal Component
const QuizModal: React.FC<{
  badge: StoryBadge | null;
  visible: boolean;
  isUnlocked: boolean;
  onClose: () => void;
  onUnlock: (badgeId: string) => void;
}> = ({ badge, visible, isUnlocked, onClose, onUnlock }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
      setAttempts(0);
    }
  }, [visible]);

  if (!badge) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];
  const isCorrect = selectedAnswer === badge.quiz.correctAnswer;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    setAttempts(prev => prev + 1);
    
    if (isCorrect && !isUnlocked) {
      // Unlock the badge!
      onUnlock(badge.id);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (attempts >= 1) {
      setShowHint(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={ZoomIn.duration(300)}
          style={[styles.modalContent, { borderColor: rarityColor }]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: rarityColor + '30' }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.bookIcon}>📚</Text>
              <View>
                <Text style={styles.modalBookLabel}>Book {badge.bookNumber} Quiz</Text>
                <Text style={[styles.modalTitle, { color: rarityColor }]}>{badge.title}</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} role="button">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Badge Preview */}
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: badge.imageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={[styles.previewRarity, { backgroundColor: rarityColor }]}>
                <Text style={styles.previewRarityText}>{badge.rarity}</Text>
              </View>
            </View>

            {isUnlocked ? (
              // Already unlocked - show badge details
              <View style={styles.unlockedContent}>
                <Text style={styles.unlockedTitle}>🎉 Badge Unlocked!</Text>
                <Text style={styles.unlockedDescription}>{badge.description}</Text>
                <View style={styles.learnedBox}>
                  <Text style={styles.learnedLabel}>💡 WHAT YOU LEARNED</Text>
                  <Text style={styles.learnedText}>{badge.quiz.explanation}</Text>
                </View>
                <PixelButton
                  title="CLOSE"
                  onPress={onClose}
                  color={rarityColor}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : showResult ? (
              // Show result
              <View style={styles.resultContent}>
                {isCorrect ? (
                  <>
                    <Animated.View entering={ZoomIn.duration(500)}>
                      <Text style={styles.resultIcon}>🏆</Text>
                    </Animated.View>
                    <Text style={styles.correctText}>CORRECT!</Text>
                    <Text style={styles.resultDescription}>
                      You've unlocked the {badge.title} badge!
                    </Text>
                    <View style={styles.xpEarnedBox}>
                      <Text style={styles.xpEarnedText}>+{badge.xpReward} XP EARNED!</Text>
                    </View>
                    <View style={styles.learnedBox}>
                      <Text style={styles.learnedLabel}>💡 EXPLANATION</Text>
                      <Text style={styles.learnedText}>{badge.quiz.explanation}</Text>
                    </View>
                    <PixelButton
                      title="AWESOME!"
                      onPress={onClose}
                      color="#00FF88"
                      style={{ marginTop: 16 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.resultIcon}>❌</Text>
                    <Text style={styles.wrongText}>Not quite!</Text>
                    <Text style={styles.resultDescription}>
                      That's not the right answer. Try again!
                    </Text>
                    <PixelButton
                      title="TRY AGAIN"
                      onPress={handleTryAgain}
                      color={rarityColor}
                      style={{ marginTop: 16 }}
                    />
                  </>
                )}
              </View>
            ) : (
              // Show quiz
              <View style={styles.quizContent}>
                <Text style={styles.questionText}>{badge.quiz.question}</Text>

                {/* Hint */}
                {showHint && badge.quiz.hint && (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintLabel}>💡 HINT</Text>
                    <Text style={styles.hintText}>{badge.quiz.hint}</Text>
                  </View>
                )}

                {/* Answer Options */}
                <View style={styles.optionsContainer}>
                  {badge.quiz.options.map((option, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.optionButton,
                        selectedAnswer === index && styles.optionSelected,
                        selectedAnswer === index && { borderColor: rarityColor, backgroundColor: rarityColor + '20' },
                      ]}
                      onPress={() => setSelectedAnswer(index)}
                      role="button"
                    >
                      <View style={[
                        styles.optionCircle,
                        selectedAnswer === index && { backgroundColor: rarityColor },
                      ]}>
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        selectedAnswer === index && { color: CRT_COLORS.textBright },
                      ]}>
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <PixelButton
                  title="SUBMIT ANSWER"
                  onPress={handleSubmit}
                  color={rarityColor}
                  disabled={selectedAnswer === null}
                  style={{ marginTop: 16 }}
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Story Badges Section Component
export const StoryBadgesSection: React.FC = () => {
  const { profile, addXP, mintBadge } = useGameStore();
  const [selectedBadge, setSelectedBadge] = useState<StoryBadge | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  // Load unlocked story badges from profile
  useEffect(() => {
    if (profile?.badges) {
      const storyBadgeIds = profile.badges
        .filter(b => b.gameId === 'story-quiz')
        .map(b => b.traits?.storyBadgeId as string)
        .filter(Boolean);
      setUnlockedBadges(storyBadgeIds);
    }
  }, [profile]);

  const handleUnlockBadge = (badgeId: string) => {
    const badge = getStoryBadgeById(badgeId);
    if (!badge) return;

    // Add XP reward
    addXP(badge.xpReward);

    // Mint the badge
    mintBadge({
      name: badge.title,
      description: badge.description,
      rarity: badge.rarity as 'Common' | 'Rare' | 'Epic' | 'Legendary',
      gameId: 'story-quiz',
      traits: { 
        storyBadgeId: badgeId,
        bookNumber: badge.bookNumber,
        imageUrl: badge.imageUrl,
      },
      icon: '📚',
    });

    // Update local state
    setUnlockedBadges(prev => [...prev, badgeId]);
  };

  const isBadgeUnlocked = (badgeId: string) => unlockedBadges.includes(badgeId);

  const totalBadges = STORY_BADGES.length;
  const unlockedCount = unlockedBadges.length;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sectionIcon}>📖</Text>
          <View>
            <Text style={styles.sectionTitle}>STORY BADGES</Text>
            <Text style={styles.sectionSubtitle}>Book Reader Achievements</Text>
          </View>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{unlockedCount}/{totalBadges}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Unlock rare badges by answering quizzes from the Web3 Chaos Chronicles book series!
      </Text>

      {/* Badge Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeGrid}
      >
        {STORY_BADGES.map((badge, index) => (
          <StoryBadgeCard
            key={badge.id}
            badge={badge}
            isUnlocked={isBadgeUnlocked(badge.id)}
            onPress={() => setSelectedBadge(badge)}
            index={index}
          />
        ))}}
      </ScrollView>

      {/* Quiz Modal */}
      <QuizModal
        badge={selectedBadge}
        visible={selectedBadge !== null}
        isUnlocked={selectedBadge ? isBadgeUnlocked(selectedBadge.id) : false}
        onClose={() => setSelectedBadge(null)}
        onUnlock={handleUnlockBadge}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressBadge: {
    backgroundColor: CRT_COLORS.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  badgeGrid: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  badgeCard: {
    width: BADGE_CARD_WIDTH,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeCardLocked: {
    opacity: 0.85,
  },
  badgeGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 60,
    borderRadius: 30,
  },
  badgeImageContainer: {
    height: 100,
    backgroundColor: CRT_COLORS.bgDark,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  lockedImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
  },
  lockIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  quizText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 8,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  badgeInfo: {
    padding: 10,
  },
  badgeTitle: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  xpContainer: {
    backgroundColor: COLORS.chainGold + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 10,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  actionHint: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  modalBookLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: CRT_COLORS.textDim,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: CRT_COLORS.bgMedium,
  },
  previewRarity: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewRarityText: {
    fontSize: 10,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Quiz Styles
  quizContent: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  hintBox: {
    backgroundColor: COLORS.chainGold + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.chainGold + '40',
  },
  hintLabel: {
    fontSize: 10,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: CRT_COLORS.bgMedium,
    padding: 12,
    marginBottom: 10,
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },

  // Result Styles
  resultContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  correctText: {
    fontSize: 24,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wrongText: {
    fontSize: 24,
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  xpEarnedBox: {
    backgroundColor: COLORS.chainGold + '20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  xpEarnedText: {
    fontSize: 16,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  learnedBox: {
    backgroundColor: CRT_COLORS.accentCyan + '15',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
  },
  learnedLabel: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  learnedText: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },

  // Unlocked Content Styles
  unlockedContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  unlockedTitle: {
    fontSize: 20,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  unlockedDescription: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
});

export default StoryBadgesSection;
