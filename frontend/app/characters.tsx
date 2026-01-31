// BlockQuest Official - Character Profile Page
// Dedicated page for viewing and managing characters

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Text,
  Image,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { 
  CHARACTERS, 
  CharacterConfig,
  getCharacterById,
  getRarityColor,
  getMainCharacters,
} from '../src/constants/characters';
import { 
  useCharacterStore, 
  PlayerStats,
  CharacterProgress,
} from '../src/store/characterStore';
import { useGameStore } from '../src/store/gameStore';
import { STORY_MAPPINGS, getGamesByCharacter } from '../src/constants/storyMapping';

// Character portrait with animated border
const CharacterPortrait: React.FC<{
  character: CharacterConfig;
  isUnlocked: boolean;
  isSelected: boolean;
  progress?: CharacterProgress;
  onSelect: () => void;
}> = ({ character, isUnlocked, isSelected, progress, onSelect }) => {
  const rarityColor = getRarityColor(character.rarity);
  const borderPulse = useSharedValue(1);
  
  useEffect(() => {
    if (isSelected) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      borderPulse.value = 1;
    }
  }, [isSelected]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: borderPulse.value }],
  }));
  
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/png?seed=${character.id}&backgroundColor=${character.colors.primary.replace('#', '')}`;
  
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
      <Animated.View 
        style={[
          styles.portraitContainer,
          isSelected && styles.portraitSelected,
          !isUnlocked && styles.portraitLocked,
          { borderColor: isSelected ? character.colors.primary : CRT_COLORS.bgMedium },
          animatedStyle,
        ]}
      >
        {isUnlocked ? (
          <Image source={{ uri: avatarUrl }} style={styles.portraitImage} />
        ) : (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
        
        {/* Rarity indicator */}
        <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        
        {/* Level badge */}
        {isUnlocked && progress && (
          <View style={[styles.levelBadge, { backgroundColor: character.colors.primary }]}>
            <Text style={styles.levelText}>L{progress.level}</Text>
          </View>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: character.colors.primary }]}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[
        styles.portraitName, 
        { color: isUnlocked ? character.colors.primary : CRT_COLORS.textDim }
      ]}>
        {character.name}
      </Text>
    </TouchableOpacity>
  );
};

// Character stats card
const CharacterStatsCard: React.FC<{
  character: CharacterConfig;
  progress: CharacterProgress;
}> = ({ character, progress }) => {
  const xpToNextLevel = 100;
  const currentLevelXP = progress.xp % xpToNextLevel;
  const xpProgress = (currentLevelXP / xpToNextLevel) * 100;
  
  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      style={[styles.statsCard, { borderColor: character.colors.primary }]}
    >
      <Text style={styles.statsTitle}>📊 CHARACTER STATS</Text>
      
      {/* XP Bar */}
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>LEVEL {progress.level}</Text>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBarFill, { width: `${xpProgress}%`, backgroundColor: character.colors.primary }]} />
        </View>
        <Text style={styles.statValue}>{currentLevelXP}/{xpToNextLevel} XP</Text>
      </View>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{progress.gamesPlayed}</Text>
          <Text style={styles.statBoxLabel}>GAMES</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{progress.totalScore}</Text>
          <Text style={styles.statBoxLabel}>TOTAL SCORE</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: character.colors.primary }]}>
            +{character.specialAbility.bonus}%
          </Text>
          <Text style={styles.statBoxLabel}>BONUS</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Character ability card
const CharacterAbilityCard: React.FC<{
  character: CharacterConfig;
}> = ({ character }) => {
  const affectedGames = STORY_MAPPINGS.filter(m => 
    character.specialAbility.affectedGames.includes(m.gameId) ||
    character.specialAbility.affectedGames.includes('all')
  );
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(100).duration(300)}
      style={[styles.abilityCard, { borderColor: character.colors.primary }]}
    >
      <View style={styles.abilityHeader}>
        <Text style={styles.abilityIcon}>{character.specialAbility.icon}</Text>
        <View style={styles.abilityInfo}>
          <Text style={[styles.abilityName, { color: character.colors.primary }]}>
            {character.specialAbility.name}
          </Text>
          <Text style={styles.abilityDesc}>{character.specialAbility.description}</Text>
        </View>
      </View>
      
      {/* Affected Games */}
      <Text style={styles.sectionLabel}>BONUS GAMES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gamesScroll}>
        {affectedGames.slice(0, 5).map(game => (
          <View key={game.gameId} style={styles.gameChip}>
            <Text style={styles.gameChipText}>{game.chapterTitle}</Text>
          </View>
        ))}
        {character.specialAbility.affectedGames.includes('all') && (
          <View style={[styles.gameChip, { backgroundColor: character.colors.primary }]}>
            <Text style={[styles.gameChipText, { color: '#FFF' }]}>ALL GAMES!</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

// Character backstory card
const CharacterBackstoryCard: React.FC<{
  character: CharacterConfig;
}> = ({ character }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(200).duration(300)}
      style={[styles.backstoryCard, { borderColor: character.colors.primary }]}
    >
      <Text style={styles.backstoryTitle}>📖 BACKSTORY</Text>
      
      <View style={styles.quoteBox}>
        <Text style={[styles.catchphrase, { color: character.colors.primary }]}>
          "{character.catchphrase}"
        </Text>
      </View>
      
      <Text style={styles.backstoryText}>{character.backstory}</Text>
      
      <View style={styles.eraTag}>
        <Text style={[styles.eraText, { color: character.colors.primary }]}>
          {character.eraTag}
        </Text>
      </View>
    </Animated.View>
  );
};

// Unlock requirements card
const UnlockRequirementsCard: React.FC<{
  character: CharacterConfig;
  playerStats: PlayerStats;
}> = ({ character, playerStats }) => {
  const { unlockRequirement } = character;
  
  let progress = 0;
  let current = 0;
  let target = unlockRequirement.value;
  
  switch (unlockRequirement.type) {
    case 'points':
      current = playerStats.totalScore;
      progress = Math.min(100, (current / target) * 100);
      break;
    case 'games':
      current = playerStats.uniqueGamesCompleted;
      progress = Math.min(100, (current / target) * 100);
      break;
    case 'level':
      current = playerStats.level;
      progress = Math.min(100, (current / target) * 100);
      break;
    case 'characters':
      current = playerStats.unlockedCharacterCount;
      progress = Math.min(100, (current / target) * 100);
      break;
  }
  
  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      style={styles.unlockCard}
    >
      <Text style={styles.unlockTitle}>🔓 HOW TO UNLOCK</Text>
      <Text style={styles.unlockDesc}>{unlockRequirement.description}</Text>
      
      <View style={styles.unlockProgressBar}>
        <View style={[styles.unlockProgressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.unlockProgressText}>
        {current}/{target} ({Math.round(progress)}%)
      </Text>
    </Animated.View>
  );
};

// Main Character Profile Page
export default function CharacterProfilePage() {
  const router = useRouter();
  const { 
    selectedCharacterId, 
    selectCharacter,
    unlockedCharacterIds,
    characterProgress,
    isCharacterUnlocked,
  } = useCharacterStore();
  const { profile, highScores } = useGameStore();
  
  const [viewingCharacterId, setViewingCharacterId] = useState(selectedCharacterId);
  const viewingCharacter = getCharacterById(viewingCharacterId);
  const isViewingUnlocked = isCharacterUnlocked(viewingCharacterId);
  const progress = characterProgress[viewingCharacterId];
  
  // Calculate player stats for unlock requirements
  const playerStats: PlayerStats = {
    totalScore: Object.values(highScores).reduce((sum, s) => sum + s, 0),
    gamesPlayed: Object.keys(highScores).filter(k => highScores[k] > 0).length,
    level: profile?.level || 1,
    uniqueGamesCompleted: Object.keys(highScores).filter(k => highScores[k] > 0).length,
    unlockedCharacterCount: unlockedCharacterIds.filter(id => id !== 'collective').length,
  };
  
  const handleSelectCharacter = () => {
    if (isViewingUnlocked && viewingCharacterId !== selectedCharacterId) {
      selectCharacter(viewingCharacterId);
    }
  };
  
  if (!viewingCharacter) return null;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 CHARACTERS</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Character Selection Row */}
      <View 
        style={styles.characterRow}
        accessibilityLabel="Character selection"
        accessibilityRole="tablist"
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.characterRowContent}
        >
          {CHARACTERS.map((char, index) => (
            <CharacterPortrait
              key={char.id}
              character={char}
              isUnlocked={isCharacterUnlocked(char.id)}
              isSelected={viewingCharacterId === char.id}
              progress={characterProgress[char.id]}
              onSelect={() => setViewingCharacterId(char.id)}
            />
          ))}
        </ScrollView>
      </View>
      
      {/* Character Details */}
      <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
        {/* Character Header */}
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={[styles.characterHeader, { borderColor: viewingCharacter.colors.primary }]}
        >
          <View style={styles.characterHeaderLeft}>
            <Text style={[styles.characterName, { color: viewingCharacter.colors.primary }]}>
              {viewingCharacter.fullName}
            </Text>
            <Text style={styles.characterTitle}>{viewingCharacter.title}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(viewingCharacter.rarity) }]}>
              <Text style={styles.rarityText}>{viewingCharacter.rarity}</Text>
            </View>
          </View>
          
          {/* Select Button */}
          {isViewingUnlocked && (
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: viewingCharacter.colors.primary },
                viewingCharacterId === selectedCharacterId && styles.selectButtonActive,
              ]}
              onPress={handleSelectCharacter}
              disabled={viewingCharacterId === selectedCharacterId}
              accessibilityLabel={viewingCharacterId === selectedCharacterId ? "Currently selected character" : "Select this character"}
              accessibilityRole="button"
            >
              <Text style={styles.selectButtonText}>
                {viewingCharacterId === selectedCharacterId ? '✓ ACTIVE' : 'SELECT'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Content based on unlock status */}
        {isViewingUnlocked ? (
          <>
            {progress && <CharacterStatsCard character={viewingCharacter} progress={progress} />}
            <CharacterAbilityCard character={viewingCharacter} />
            <CharacterBackstoryCard character={viewingCharacter} />
          </>
        ) : (
          <>
            <UnlockRequirementsCard character={viewingCharacter} playerStats={playerStats} />
            <CharacterBackstoryCard character={viewingCharacter} />
          </>
        )}
      </ScrollView>
      
      {/* Unlock Progress Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {unlockedCharacterIds.length}/{CHARACTERS.length} CHARACTERS UNLOCKED
        </Text>
      </View>
    </SafeAreaView>
  );
}

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
  headerTitle: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  headerRight: {
    width: 60,
  },
  characterRow: {
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.bgMedium,
  },
  characterRowContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  portraitContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  portraitSelected: {
    borderWidth: 3,
  },
  portraitLocked: {
    opacity: 0.6,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
  },
  lockIcon: {
    fontSize: 20,
  },
  rarityDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectedBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
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
  portraitName: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  characterHeaderLeft: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  characterTitle: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
  },
  rarityText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectButtonActive: {
    opacity: 0.7,
  },
  selectButtonText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statRow: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 9,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statBoxLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  abilityCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  abilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  abilityIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  abilityDesc: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  gamesScroll: {
    marginHorizontal: -4,
  },
  gameChip: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  gameChipText: {
    fontSize: 9,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backstoryCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  backstoryTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quoteBox: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  catchphrase: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backstoryText: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  eraTag: {
    marginTop: 12,
    alignItems: 'center',
  },
  eraText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  unlockCard: {
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6464',
    padding: 16,
    marginBottom: 12,
  },
  unlockTitle: {
    fontSize: 12,
    color: '#FF6464',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  unlockDesc: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  unlockProgressBar: {
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  unlockProgressFill: {
    height: '100%',
    backgroundColor: '#FF6464',
    borderRadius: 4,
  },
  unlockProgressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  footer: {
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.bgMedium,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
