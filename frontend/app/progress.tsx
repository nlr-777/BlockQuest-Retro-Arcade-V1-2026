// BlockQuest Official - Progress Dashboard
// Comprehensive view of player progress, story completion, and achievements

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
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { useGameStore } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import { useAccessibilityStore } from '../src/utils/accessibility';
import { CHARACTERS, getCharacterById } from '../src/constants/characters';
import { STORY_CHAPTERS, BOOK_TITLES, STORY_MAPPINGS, getGamesByBook } from '../src/constants/storyMapping';
import { GAMES } from '../src/constants/games';
import { 
  useStoryAchievements, 
  STORY_ACHIEVEMENTS, 
  getAchievementRarityColor 
} from '../src/services/StoryAchievements';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated progress ring component
const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  color?: string;
  label?: string;
}> = ({ progress, size = 100, color = CRT_COLORS.primary, label }) => {
  const animatedProgress = useSharedValue(0);
  const { reduceMotion } = useAccessibilityStore();
  
  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = progress;
    } else {
      animatedProgress.value = withTiming(progress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, reduceMotion]);
  
  return (
    <View style={[progressRingStyles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[
        progressRingStyles.ring,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderColor: CRT_COLORS.bgMedium,
        }
      ]} />
      
      {/* Progress indicator (simplified) */}
      <View style={[
        progressRingStyles.progressOverlay,
        { 
          width: size - 16, 
          height: size - 16, 
          borderRadius: (size - 16) / 2,
          borderColor: color,
          borderWidth: progress > 0 ? 4 : 0,
        }
      ]} />
      
      {/* Center content */}
      <View style={progressRingStyles.center}>
        <Text style={[progressRingStyles.percentage, { color }]}>
          {Math.round(progress)}%
        </Text>
        {label && (
          <Text style={progressRingStyles.label}>{label}</Text>
        )}
      </View>
    </View>
  );
};

const progressRingStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 6,
  },
  progressOverlay: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  label: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
});

// Stat card component
const StatCard: React.FC<{
  icon: string;
  value: number | string;
  label: string;
  color?: string;
  delay?: number;
}> = ({ icon, value, label, color = CRT_COLORS.primary, delay = 0 }) => {
  const { reduceMotion } = useAccessibilityStore();
  
  return (
    <Animated.View 
      entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}
      style={[statCardStyles.card, { borderColor: color + '50' }]}
    >
      <Text style={statCardStyles.icon}>{icon}</Text>
      <Text style={[statCardStyles.value, { color }]}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </Animated.View>
  );
};

const statCardStyles = StyleSheet.create({
  card: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 3,
    marginHorizontal: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  label: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    textAlign: 'center',
  },
});

// Book progress row
const BookProgressRow: React.FC<{
  bookNumber: number;
  delay?: number;
}> = ({ bookNumber, delay = 0 }) => {
  const { highScores } = useGameStore();
  const { reduceMotion } = useAccessibilityStore();
  const bookInfo = BOOK_TITLES[bookNumber];
  const bookGames = getGamesByBook(bookNumber);
  
  const completedGames = bookGames.filter(g => (highScores[g.gameId] || 0) > 0).length;
  const masteredGames = bookGames.filter(g => (highScores[g.gameId] || 0) >= 500).length;
  const progress = bookGames.length > 0 ? (completedGames / bookGames.length) * 100 : 0;
  
  if (!bookInfo) return null;
  
  return (
    <Animated.View 
      entering={reduceMotion ? undefined : FadeInRight.delay(delay).duration(300)}
      style={bookProgressStyles.row}
    >
      <View style={bookProgressStyles.iconContainer}>
        <Text style={bookProgressStyles.bookIcon}>{bookInfo.icon}</Text>
      </View>
      
      <View style={bookProgressStyles.content}>
        <Text style={bookProgressStyles.title} numberOfLines={1}>
          {bookInfo.title}
        </Text>
        <Text style={bookProgressStyles.subtitle} numberOfLines={1}>
          {bookInfo.subtitle}
        </Text>
        
        {/* Progress bar */}
        <View style={bookProgressStyles.progressBar}>
          <View 
            style={[
              bookProgressStyles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        
        <Text style={bookProgressStyles.stats}>
          {completedGames}/{bookGames.length} games • {masteredGames} mastered
        </Text>
      </View>
      
      <View style={bookProgressStyles.percentContainer}>
        <Text style={bookProgressStyles.percent}>{Math.round(progress)}%</Text>
      </View>
    </Animated.View>
  );
};

const bookProgressStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 3,
  },
  stats: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  percentContainer: {
    marginLeft: 12,
  },
  percent: {
    fontSize: 16,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

// Achievement mini card
const AchievementMini: React.FC<{
  name: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
}> = ({ name, icon, rarity, unlocked }) => {
  const color = getAchievementRarityColor(rarity);
  
  return (
    <View style={[
      achievementMiniStyles.card,
      { 
        borderColor: unlocked ? color : CRT_COLORS.bgMedium,
        opacity: unlocked ? 1 : 0.5,
      }
    ]}>
      <Text style={achievementMiniStyles.icon}>{unlocked ? icon : '🔒'}</Text>
      <Text 
        style={[
          achievementMiniStyles.name, 
          { color: unlocked ? color : CRT_COLORS.textDim }
        ]} 
        numberOfLines={1}
      >
        {unlocked ? name : '???'}
      </Text>
    </View>
  );
};

const achievementMiniStyles = StyleSheet.create({
  card: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 56) / 4,
    marginHorizontal: 2,
    marginVertical: 4,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  name: {
    fontSize: 7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
});

// Main Progress Dashboard
export default function ProgressDashboard() {
  const router = useRouter();
  const { profile, highScores } = useGameStore();
  const { unlockedCharacterIds, unlockedStoryChapters, selectedCharacterId } = useCharacterStore();
  const { reduceMotion } = useAccessibilityStore();
  const achievements = useStoryAchievements();
  
  // Calculate overall stats
  const totalScore = Object.values(highScores).reduce((sum, s) => sum + s, 0);
  const gamesPlayed = Object.keys(highScores).filter(k => highScores[k] > 0).length;
  const totalGames = GAMES.length;
  const charactersUnlocked = unlockedCharacterIds.length;
  const totalCharacters = CHARACTERS.length;
  const chaptersRead = unlockedStoryChapters.length;
  const totalChapters = STORY_CHAPTERS.length;
  
  // Calculate story progress
  const storyProgress = (chaptersRead / totalChapters) * 100;
  
  // Calculate game completion
  const gameCompletion = (gamesPlayed / totalGames) * 100;
  
  // Calculate character progress
  const characterProgress = (charactersUnlocked / totalCharacters) * 100;
  
  return (
    <View style={styles.container}>
      <PixelRain count={8} speed={6000} />
      <CRTScanlines opacity={0.04} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 PROGRESS</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Section */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>📈 OVERALL PROGRESS</Text>
            
            <View style={styles.ringRow}>
              <ProgressRing 
                progress={storyProgress} 
                size={90} 
                color={CRT_COLORS.accentCyan}
                label="STORY"
              />
              <ProgressRing 
                progress={gameCompletion} 
                size={90} 
                color={CRT_COLORS.primary}
                label="GAMES"
              />
              <ProgressRing 
                progress={characterProgress} 
                size={90} 
                color={CRT_COLORS.accentMagenta}
                label="HEROES"
              />
            </View>
          </Animated.View>
          
          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ QUICK STATS</Text>
            <View style={styles.statsRow}>
              <StatCard 
                icon="🎮" 
                value={gamesPlayed} 
                label="GAMES PLAYED" 
                delay={100}
              />
              <StatCard 
                icon="⭐" 
                value={totalScore.toLocaleString()} 
                label="TOTAL SCORE"
                color={CRT_COLORS.accentGold}
                delay={200}
              />
              <StatCard 
                icon="📚" 
                value={chaptersRead} 
                label="CHAPTERS"
                color={CRT_COLORS.accentCyan}
                delay={300}
              />
            </View>
            
            <View style={[styles.statsRow, { marginTop: 8 }]}>
              <StatCard 
                icon="🦸" 
                value={charactersUnlocked} 
                label="HEROES"
                color={CRT_COLORS.accentMagenta}
                delay={400}
              />
              <StatCard 
                icon="🏆" 
                value={profile?.badges?.length || 0} 
                label="BADGES"
                color={CRT_COLORS.accentGold}
                delay={500}
              />
              <StatCard 
                icon="📈" 
                value={profile?.level || 1} 
                label="LEVEL"
                delay={600}
              />
            </View>
          </View>
          
          {/* Book Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 STORY PROGRESS</Text>
            <BookProgressRow bookNumber={1} delay={100} />
            <BookProgressRow bookNumber={2} delay={200} />
            <BookProgressRow bookNumber={3} delay={300} />
            <BookProgressRow bookNumber={4} delay={400} />
            <BookProgressRow bookNumber={5} delay={500} />
            
            <TouchableOpacity 
              style={styles.viewAllBtn}
              onPress={() => router.push('/story')}
            >
              <Text style={styles.viewAllText}>VIEW FULL STORY →</Text>
            </TouchableOpacity>
          </View>
          
          {/* Achievements Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏅 ACHIEVEMENTS</Text>
              <Text style={styles.achievementCount}>
                {achievements.totalUnlocked}/{achievements.totalAchievements}
              </Text>
            </View>
            
            <View style={styles.achievementsGrid}>
              {STORY_ACHIEVEMENTS.slice(0, 8).map((ach) => (
                <AchievementMini
                  key={ach.id}
                  name={ach.name}
                  icon={ach.icon}
                  rarity={ach.rarity}
                  unlocked={achievements.unlockedAchievements.some(u => u.id === ach.id)}
                />
              ))}
            </View>
            
            <View style={styles.achievementProgressBar}>
              <View 
                style={[
                  styles.achievementProgressFill, 
                  { width: `${achievements.totalProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.achievementProgressText}>
              {achievements.totalProgress}% Complete
            </Text>
          </View>
          
          {/* Characters Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🦸 HEROES UNLOCKED</Text>
            <View style={styles.characterRow}>
              {CHARACTERS.map((char) => {
                const isUnlocked = unlockedCharacterIds.includes(char.id);
                const isSelected = char.id === selectedCharacterId;
                
                return (
                  <TouchableOpacity
                    key={char.id}
                    style={[
                      styles.characterCard,
                      { 
                        borderColor: isUnlocked ? char.colors.primary : CRT_COLORS.bgMedium,
                        opacity: isUnlocked ? 1 : 0.5,
                      },
                      isSelected && styles.characterSelected,
                    ]}
                    onPress={() => router.push('/characters')}
                  >
                    <Text style={styles.characterIcon}>
                      {isUnlocked ? char.specialAbility.icon : '🔒'}
                    </Text>
                    <Text 
                      style={[
                        styles.characterName,
                        { color: isUnlocked ? char.colors.primary : CRT_COLORS.textDim }
                      ]}
                    >
                      {isUnlocked ? char.name : '???'}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: char.colors.primary }]}>
                        <Text style={styles.selectedText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity 
              style={styles.viewAllBtn}
              onPress={() => router.push('/characters')}
            >
              <Text style={styles.viewAllText}>VIEW CHARACTERS →</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
    borderBottomColor: CRT_COLORS.bgMedium,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1,
  },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewAllBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 11,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  achievementCount: {
    fontSize: 11,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.accentGold,
    borderRadius: 4,
  },
  achievementProgressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
  characterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  characterCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 3,
    margin: 4,
  },
  characterSelected: {
    borderWidth: 3,
  },
  characterIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  characterName: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
