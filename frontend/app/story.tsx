// BlockQuest Official - Story Mode Page
// Interactive Web3 Chaos Chronicles with episodes, quizzes, and Chaos Mode effects

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { 
  CRTScanlines, 
  PixelRain, 
  CRTFlickerText,
} from '../src/components/CRTEffects';
import { 
  FloatingSparkles, 
  HolographicShine,
  RainbowPulseBorder,
  MegaConfetti,
} from '../src/components/ChaosEffects';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { StoryEpisodePlayer } from '../src/components/StoryEpisodePlayer';
import { STORY_EPISODES, StoryEpisode } from '../src/constants/storyEpisodes';
import { useGameStore } from '../src/store/gameStore';
import audioManager from '../src/utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Episode Card Component with Chaos effects
const EpisodeCard: React.FC<{
  episode: StoryEpisode;
  index: number;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
}> = ({ episode, index, isCompleted, isLocked, onPress }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!isLocked && !isCompleted) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isLocked, isCompleted]);

  const handlePressIn = () => {
    if (!isLocked) {
      scale.value = withSpring(0.97);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF00FF'];
  const cardColor = cardColors[index % cardColors.length];

  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 100).springify()}
      style={cardStyle}
    >
      <TouchableOpacity
        style={[
          styles.episodeCard,
          { borderColor: isLocked ? CRT_COLORS.textDim : cardColor },
          isCompleted && styles.episodeCardCompleted,
          isLocked && styles.episodeCardLocked,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked}
        activeOpacity={0.9}
      >
        {/* Glow effect */}
        {!isLocked && (
          <Animated.View 
            style={[
              styles.cardGlow,
              { backgroundColor: cardColor },
              glowStyle
            ]} 
          />
        )}

        {/* Episode number */}
        <View style={[styles.episodeNumber, { backgroundColor: isLocked ? CRT_COLORS.textDim : cardColor }]}>
          <Text style={styles.episodeNumberText}>
            {isLocked ? '🔒' : index + 1}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.episodeContent}>
          <View style={styles.episodeTitleRow}>
            <Text style={styles.episodeIcon}>{episode.icon}</Text>
            <Text style={[
              styles.episodeTitle,
              isLocked && styles.episodeTitleLocked
            ]}>
              {isLocked ? '???' : episode.title}
            </Text>
          </View>
          <Text style={[
            styles.episodeSubtitle,
            isLocked && styles.episodeSubtitleLocked
          ]}>
            {isLocked ? 'Complete previous episodes to unlock' : episode.subtitle}
          </Text>
          
          {/* Rewards preview */}
          {!isLocked && (
            <View style={styles.rewardsRow}>
              <View style={[styles.rewardBadge, { backgroundColor: COLORS.chainGold + '30' }]}>
                <Text style={styles.rewardText}>+{episode.rewards.xp} XP</Text>
              </View>
              {episode.rewards.coins && (
                <View style={[styles.rewardBadge, { backgroundColor: '#00FF88' + '30' }]}>
                  <Text style={styles.rewardText}>+{episode.rewards.coins} 🪙</Text>
                </View>
              )}
              {episode.rewards.badge && (
                <View style={[styles.rewardBadge, { backgroundColor: '#FF00FF' + '30' }]}>
                  <Text style={styles.rewardText}>🏆 Badge</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓</Text>
            </View>
          ) : !isLocked ? (
            <Text style={[styles.playButton, { color: cardColor }]}>PLAY ▶</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Progress Header Component
const ProgressHeader: React.FC<{
  completedCount: number;
  totalCount: number;
}> = ({ completedCount, totalCount }) => {
  const progress = (completedCount / totalCount) * 100;

  return (
    <View style={styles.progressHeader}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressTitle}>📚 YOUR JOURNEY</Text>
        <Text style={styles.progressCount}>
          {completedCount}/{totalCount} Episodes
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={[styles.progressFill, { width: `${progress}%` }]} 
          />
        </View>
      </View>
      {completedCount === totalCount ? (
        <Text style={styles.progressComplete}>🌟 STORY MASTER! 🌟</Text>
      ) : (
        <Text style={styles.progressHint}>
          Complete episodes to learn Web3 concepts!
        </Text>
      )}
    </View>
  );
};

// Mascot Component
const StoryMascot: React.FC = () => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[styles.mascotContainer, animatedStyle]}>
      <Text style={styles.mascotEmoji}>📖</Text>
      <View style={styles.mascotBubble}>
        <Text style={styles.mascotText}>
          Learn Web3 through{'\n'}fun stories! 🚀
        </Text>
      </View>
    </Animated.View>
  );
};

// Main Story Page
export default function StoryPage() {
  const router = useRouter();
  const { profile, addXP, addBadge } = useGameStore();
  const [selectedEpisode, setSelectedEpisode] = useState<StoryEpisode | null>(null);
  const [completedEpisodes, setCompletedEpisodes] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load completed episodes from profile
  useEffect(() => {
    if (profile?.completedStoryEpisodes) {
      setCompletedEpisodes(profile.completedStoryEpisodes);
    }
  }, [profile]);

  const isEpisodeLocked = (index: number): boolean => {
    if (index === 0) return false; // First episode always unlocked
    // Unlock next episode when previous is completed
    const previousEpisode = STORY_EPISODES[index - 1];
    return !completedEpisodes.includes(previousEpisode.id);
  };

  const handleEpisodePress = (episode: StoryEpisode, index: number) => {
    if (!isEpisodeLocked(index)) {
      audioManager.playSound('click');
      setSelectedEpisode(episode);
    }
  };

  const handleEpisodeComplete = (rewards: { xp: number; coins?: number; badge?: string }) => {
    if (selectedEpisode && !completedEpisodes.includes(selectedEpisode.id)) {
      // Add to completed
      const newCompleted = [...completedEpisodes, selectedEpisode.id];
      setCompletedEpisodes(newCompleted);

      // Award XP
      addXP(rewards.xp);

      // Award badge if any
      if (rewards.badge) {
        addBadge(rewards.badge);
      }

      // Show celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      audioManager.playSound('powerup');
    }

    setSelectedEpisode(null);
  };

  const completedCount = completedEpisodes.length;

  return (
    <View style={styles.container}>
      {/* Background effects */}
      <PixelRain count={12} speed={5000} />
      <FloatingSparkles count={15} colors={['#FFD700', '#00FF88', '#FF00FF', '#00D4FF']} />
      <CRTScanlines opacity={0.04} />

      {/* Confetti celebration */}
      {showConfetti && <MegaConfetti active={showConfetti} />}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <CRTFlickerText style={styles.headerTitle} color={CRT_COLORS.primary} glitch>
            📚 STORY MODE
          </CRTFlickerText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Mascot */}
          <StoryMascot />

          {/* Progress */}
          <ProgressHeader 
            completedCount={completedCount} 
            totalCount={STORY_EPISODES.length} 
          />

          {/* Episode List */}
          <View style={styles.episodesList}>
            <Text style={styles.sectionTitle}>📖 EPISODES</Text>
            {STORY_EPISODES.map((episode, index) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                index={index}
                isCompleted={completedEpisodes.includes(episode.id)}
                isLocked={isEpisodeLocked(index)}
                onPress={() => handleEpisodePress(episode, index)}
              />
            ))}
          </View>

          {/* Coming Soon Teaser */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.comingSoon}>
            <Text style={styles.comingSoonIcon}>🔮</Text>
            <Text style={styles.comingSoonTitle}>MORE COMING SOON</Text>
            <Text style={styles.comingSoonText}>
              New adventures await in the Web3 Chaos Chronicles!
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab="story" />
      </SafeAreaView>

      {/* Episode Player Modal */}
      {selectedEpisode && (
        <StoryEpisodePlayer
          episode={selectedEpisode}
          visible={selectedEpisode !== null}
          onClose={() => setSelectedEpisode(null)}
          onComplete={handleEpisodeComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.primary + '30',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: CRT_COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Mascot
  mascotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mascotEmoji: {
    fontSize: 48,
  },
  mascotBubble: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 12,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
  },
  mascotText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },

  // Progress Header
  progressHeader: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '30',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  progressCount: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  progressComplete: {
    fontSize: 14,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Episode Card
  episodesList: {
    marginBottom: 20,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  episodeCardCompleted: {
    borderColor: '#00FF88',
  },
  episodeCardLocked: {
    opacity: 0.6,
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: '30%',
    width: 80,
    height: 60,
    borderRadius: 40,
    opacity: 0.3,
  },
  episodeNumber: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: CRT_COLORS.bgDark,
  },
  episodeNumberText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  episodeContent: {
    flex: 1,
    padding: 12,
  },
  episodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  episodeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  episodeTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    flex: 1,
  },
  episodeTitleLocked: {
    color: CRT_COLORS.textDim,
  },
  episodeSubtitle: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
    lineHeight: 16,
  },
  episodeSubtitleLocked: {
    color: CRT_COLORS.textDim,
    fontStyle: 'italic',
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 10,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statusContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  playButton: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Coming Soon
  comingSoon: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentMagenta + '30',
    borderStyle: 'dashed',
  },
  comingSoonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  comingSoonTitle: {
    fontSize: 14,
    color: CRT_COLORS.accentMagenta,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comingSoonText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
});
