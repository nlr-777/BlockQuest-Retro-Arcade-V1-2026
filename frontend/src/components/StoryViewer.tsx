// BlockQuest Official - Story Viewer
// Comic-panel style story viewer for Web3 Chaos Chronicles
// Enhanced with polished animations and reading progress

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Text,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CRT_COLORS } from '../constants/crtTheme';
import { COLORS } from '../constants/colors';
import { 
  STORY_CHAPTERS, 
  BOOK_TITLES, 
  STORY_MAPPINGS,
  getGamesByBook,
  StoryChapter,
} from '../constants/storyMapping';
import { 
  CHARACTERS, 
  getCharacterById,
  CharacterConfig,
} from '../constants/characters';
import { useCharacterStore } from '../store/characterStore';
import { useGameStore } from '../store/gameStore';
import { useAccessibilityStore } from '../utils/accessibility';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Character avatar component with glow animation
const CharacterAvatar: React.FC<{ characterId: string; size?: number }> = ({ 
  characterId, 
  size = 40 
}) => {
  const character = getCharacterById(characterId);
  const { reduceMotion } = useAccessibilityStore();
  const glowOpacity = useSharedValue(0.5);
  
  useEffect(() => {
    if (!reduceMotion) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [reduceMotion]);
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  if (!character) return null;
  
  return (
    <View style={[
      styles.avatar,
      { 
        width: size, 
        height: size, 
        backgroundColor: character.colors.primary + '30',
        borderColor: character.colors.primary,
      }
    ]}>
      <Animated.View 
        style={[
          styles.avatarGlow,
          { 
            backgroundColor: character.colors.primary,
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) / 2,
          },
          glowStyle
        ]} 
      />
      <Text style={[styles.avatarIcon, { fontSize: size * 0.5 }]}>
        {character.specialAbility.icon}
      </Text>
    </View>
  );
};

// Reading Progress Indicator
const ReadingProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const { reduceMotion } = useAccessibilityStore();
  const animatedWidth = useSharedValue(0);
  
  useEffect(() => {
    if (reduceMotion) {
      animatedWidth.value = progress;
    } else {
      animatedWidth.value = withTiming(progress, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, reduceMotion]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));
  
  return (
    <View style={progressBarStyles.container}>
      <View style={progressBarStyles.track}>
        <Animated.View style={[progressBarStyles.fill, progressStyle]} />
      </View>
      <Text style={progressBarStyles.text}>{Math.round(progress)}% Complete</Text>
    </View>
  );
};

const progressBarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.primary + '30',
  },
  track: {
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
});

// Single story panel component with enhanced animations
const StoryPanel: React.FC<{
  chapter: StoryChapter;
  isUnlocked: boolean;
  onPress: () => void;
  index: number;
}> = ({ chapter, isUnlocked, onPress, index }) => {
  const { reduceMotion } = useAccessibilityStore();
  const bookInfo = BOOK_TITLES[chapter.bookNumber] || { icon: '📖', title: 'Prologue', subtitle: '' };
  const gamesInChapter = STORY_MAPPINGS.filter(m => chapter.gameIds.includes(m.gameId));
  const focusCharacter = gamesInChapter[0]?.characterFocus || 'zara';
  
  // Unlock shine animation
  const shinePosition = useSharedValue(-100);
  
  useEffect(() => {
    if (isUnlocked && !reduceMotion) {
      shinePosition.value = withRepeat(
        withSequence(
          withTiming(SCREEN_WIDTH + 100, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-100, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [isUnlocked, reduceMotion]);
  
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shinePosition.value }],
  }));
  
  const enteringAnimation = reduceMotion 
    ? undefined 
    : FadeInDown.delay(index * 80).duration(400).springify();
  
  return (
    <Animated.View entering={enteringAnimation}>
      <TouchableOpacity
        style={[
          styles.panel,
          isUnlocked ? styles.panelUnlocked : styles.panelLocked,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Shine effect for unlocked panels */}
        {isUnlocked && !reduceMotion && (
          <Animated.View style={[styles.shineEffect, shineStyle]} />
        )}
        {/* Chapter Number Badge */}
        <View style={[
          styles.chapterBadge,
          { backgroundColor: isUnlocked ? CRT_COLORS.primary : CRT_COLORS.bgMedium }
        ]}>
          <Text style={styles.chapterBadgeText}>
            {chapter.bookNumber === 0 ? 'INTRO' : `CH.${chapter.bookNumber}`}
          </Text>
        </View>
        
        {/* Panel Content */}
        <View style={styles.panelContent}>
          {/* Book Icon */}
          <Text style={styles.bookIcon}>{bookInfo.icon}</Text>
          
          {/* Title */}
          <Text style={[
            styles.panelTitle,
            !isUnlocked && styles.panelTitleLocked
          ]}>
            {isUnlocked ? chapter.title : '???'}
          </Text>
          
          {/* Description */}
          <Text style={[
            styles.panelDescription,
            !isUnlocked && styles.panelDescriptionLocked
          ]} numberOfLines={2}>
            {isUnlocked ? chapter.description : chapter.unlockCondition}
          </Text>
          
          {/* Character Focus (if unlocked) */}
          {isUnlocked && gamesInChapter.length > 0 && (
            <View style={styles.characterRow}>
              <CharacterAvatar characterId={focusCharacter} size={24} />
              <Text style={styles.characterName}>
                {getCharacterById(focusCharacter)?.name}'s Story
              </Text>
            </View>
          )}
        </View>
        
        {/* Lock/Unlock Indicator */}
        <View style={styles.statusIndicator}>
          {isUnlocked ? (
            <Text style={styles.readButton}>READ ▶</Text>
          ) : (
            <Text style={styles.lockIcon}>🔒</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Chapter detail modal with comic-style panels
const ChapterDetailModal: React.FC<{
  chapter: StoryChapter | null;
  visible: boolean;
  onClose: () => void;
}> = ({ chapter, visible, onClose }) => {
  const router = useRouter();
  
  if (!chapter) return null;
  
  const bookInfo = BOOK_TITLES[chapter.bookNumber] || { icon: '📖', title: 'Prologue', subtitle: '' };
  const gamesInChapter = STORY_MAPPINGS.filter(m => chapter.gameIds.includes(m.gameId));
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalBookIcon}>{bookInfo.icon}</Text>
              <View>
                <Text style={styles.modalBookTitle}>
                  {bookInfo.title}: {bookInfo.subtitle}
                </Text>
                <Text style={styles.modalChapterTitle}>{chapter.title}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Story Content - Comic Panels */}
          <ScrollView style={styles.comicScroll}>
            {/* Intro Panel */}
            <View style={styles.comicPanel}>
              <Text style={styles.narratorText}>
                {chapter.description}
              </Text>
            </View>
            
            {/* Game Story Moments */}
            {gamesInChapter.map((game, index) => {
              const character = getCharacterById(game.characterFocus);
              if (!character) return null;
              
              return (
                <Animated.View 
                  key={game.gameId}
                  entering={SlideInRight.delay(index * 150).duration(300)}
                  style={[
                    styles.comicPanel,
                    { borderColor: character.colors.primary }
                  ]}
                >
                  {/* Character Speech Bubble */}
                  <View style={styles.speechBubble}>
                    <CharacterAvatar characterId={character.id} size={40} />
                    <View style={styles.speechContent}>
                      <Text style={[styles.speakerName, { color: character.colors.primary }]}>
                        {character.name}
                      </Text>
                      <Text style={styles.speechText}>
                        "{game.dialogueOnLoad.line}"
                      </Text>
                    </View>
                  </View>
                  
                  {/* Story Moment */}
                  <Text style={styles.storyMoment}>
                    {game.storyMoment}
                  </Text>
                  
                  {/* Fun Fact */}
                  <View style={styles.funFactBox}>
                    <Text style={styles.funFactLabel}>💡 WHAT YOU LEARNED</Text>
                    <Text style={styles.funFactText}>{game.funFact}</Text>
                  </View>
                  
                  {/* Play Game Button */}
                  <TouchableOpacity 
                    style={[styles.playGameBtn, { backgroundColor: character.colors.primary }]}
                    onPress={() => {
                      onClose();
                      router.push(`/games/${game.gameId}`);
                    }}
                  >
                    <Text style={styles.playGameText}>
                      ▶ PLAY {game.chapterTitle.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
            
            {/* Chapter End Panel */}
            {gamesInChapter.length > 0 && (
              <View style={styles.chapterEndPanel}>
                <Text style={styles.chapterEndText}>
                  ✨ End of {chapter.title} ✨
                </Text>
                <Text style={styles.continueHint}>
                  Complete more games to unlock the next chapter!
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Story Viewer Component
export const StoryViewer: React.FC = () => {
  const router = useRouter();
  const { unlockedStoryChapters, unlockStoryChapter } = useCharacterStore();
  const { highScores } = useGameStore();
  const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(null);
  
  // Check for newly unlockable chapters based on game progress
  useEffect(() => {
    STORY_CHAPTERS.forEach(chapter => {
      if (!unlockedStoryChapters.includes(chapter.id)) {
        // Check if any game in this chapter has been played
        const hasPlayedChapterGame = chapter.gameIds.some(
          gameId => (highScores[gameId] || 0) > 0
        );
        
        if (hasPlayedChapterGame || chapter.unlockCondition === 'default') {
          unlockStoryChapter(chapter.id);
        }
      }
    });
  }, [highScores, unlockedStoryChapters]);
  
  const isChapterUnlocked = (chapterId: string) => {
    return unlockedStoryChapters.includes(chapterId);
  };
  
  const handleChapterPress = (chapter: StoryChapter) => {
    if (isChapterUnlocked(chapter.id)) {
      setSelectedChapter(chapter);
    }
  };
  
  // Calculate progress
  const totalChapters = STORY_CHAPTERS.length;
  const unlockedCount = unlockedStoryChapters.length;
  const progressPercent = (unlockedCount / totalChapters) * 100;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>📚 STORY</Text>
          <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      
      {/* Reading Progress */}
      <ReadingProgress progress={progressPercent} />
      
      {/* Legacy Progress Bar - hidden */}
      {/* <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        </View>
        <Text style={styles.progressText}>
          {unlockedCount}/{totalChapters} CHAPTERS • {progressPercent}%
        </Text>
      </View>
      
      {/* Chapter List */}
      <View style={styles.chapterList}>
        {STORY_CHAPTERS.map((chapter, index) => (
          <StoryPanel
            key={chapter.id}
            chapter={chapter}
            isUnlocked={isChapterUnlocked(chapter.id)}
            onPress={() => handleChapterPress(chapter)}
            index={index}
          />
        ))}
        
        {/* Coming Soon Teaser */}
        <View style={styles.comingSoonPanel}>
          <Text style={styles.comingSoonIcon}>🔮</Text>
          <Text style={styles.comingSoonText}>More chapters coming soon...</Text>
          <Text style={styles.comingSoonHint}>
            The story of Quest Coins continues!
          </Text>
        </View>
      </View>
      
      {/* Chapter Detail Modal */}
      <ChapterDetailModal
        chapter={selectedChapter}
        visible={selectedChapter !== null}
        onClose={() => setSelectedChapter(null)}
      />
    </View>
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
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.bgMedium,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
  },
  title: {
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
  chapterList: {
    flex: 1,
  },
  chapterListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  panel: {
    flexDirection: 'row',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  panelUnlocked: {
    borderColor: CRT_COLORS.primary,
  },
  panelLocked: {
    borderColor: CRT_COLORS.bgMedium,
    opacity: 0.7,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  chapterBadge: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: CRT_COLORS.bgDark,
  },
  chapterBadgeText: {
    fontSize: 9,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  panelContent: {
    flex: 1,
    padding: 12,
  },
  bookIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  panelTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  panelTitleLocked: {
    color: CRT_COLORS.textDim,
  },
  panelDescription: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  panelDescriptionLocked: {
    color: CRT_COLORS.textDim,
    fontStyle: 'italic',
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  characterName: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 6,
  },
  statusIndicator: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readButton: {
    fontSize: 10,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  lockIcon: {
    fontSize: 20,
  },
  avatar: {
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  avatarIcon: {
    textAlign: 'center',
  },
  comingSoonPanel: {
    alignItems: 'center',
    padding: 24,
    marginTop: 8,
  },
  comingSoonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  comingSoonHint: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    opacity: 0.7,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.primary,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalBookIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  modalBookTitle: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalChapterTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: CRT_COLORS.textDim,
    fontWeight: 'bold',
  },
  comicScroll: {
    flex: 1,
    padding: 12,
  },
  comicPanel: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.bgMedium,
    padding: 12,
    marginBottom: 12,
  },
  narratorText: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  speechContent: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    padding: 10,
  },
  speakerName: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  speechText: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  storyMoment: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 14,
  },
  funFactBox: {
    backgroundColor: 'rgba(0, 255, 200, 0.1)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  funFactLabel: {
    fontSize: 9,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  playGameBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  playGameText: {
    fontSize: 10,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  chapterEndPanel: {
    alignItems: 'center',
    padding: 20,
    marginTop: 8,
  },
  chapterEndText: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  continueHint: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6,
  },
});

export default StoryViewer;
