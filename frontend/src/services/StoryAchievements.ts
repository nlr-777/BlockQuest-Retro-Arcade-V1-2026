// BlockQuest Official - Story Achievement System
// Links badges/achievements to story progression

import { useCharacterStore } from '../store/characterStore';
import { useGameStore } from '../store/gameStore';
import { STORY_CHAPTERS, BOOK_TITLES, getGamesByBook } from '../constants/storyMapping';
import { CHARACTERS, getCharacterById } from '../constants/characters';

export interface StoryAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  category: 'story' | 'character' | 'mastery' | 'collection';
  unlockCondition: {
    type: 'chapter' | 'character' | 'book' | 'games' | 'score' | 'level';
    value: string | number;
  };
  reward?: {
    type: 'xp' | 'title' | 'cosmetic';
    value: number | string;
  };
}

// Story-related achievements
export const STORY_ACHIEVEMENTS: StoryAchievement[] = [
  // Chapter Completion Achievements
  {
    id: 'chapter-discovery',
    name: 'The Journey Begins',
    description: 'Read the introductory chapter',
    icon: '📖',
    rarity: 'Common',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-0' },
    reward: { type: 'xp', value: 50 },
  },
  {
    id: 'chapter-building-blocks',
    name: 'Block Builder',
    description: 'Complete Book 1: Building Blocks',
    icon: '🧱',
    rarity: 'Common',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-1' },
    reward: { type: 'xp', value: 100 },
  },
  {
    id: 'chapter-trust',
    name: 'Trust Issues',
    description: 'Complete Book 2: Trust No One',
    icon: '🔐',
    rarity: 'Rare',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-2' },
    reward: { type: 'xp', value: 150 },
  },
  {
    id: 'chapter-tokens',
    name: 'Token Master',
    description: 'Complete Book 3: Creating Value',
    icon: '🪙',
    rarity: 'Rare',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-3' },
    reward: { type: 'xp', value: 150 },
  },
  {
    id: 'chapter-ownership',
    name: 'Digital Collector',
    description: 'Complete Book 4: Own Your Art',
    icon: '🎨',
    rarity: 'Epic',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-4' },
    reward: { type: 'xp', value: 200 },
  },
  {
    id: 'chapter-future',
    name: 'Future Builder',
    description: 'Complete Book 5: The Future Is Ours',
    icon: '🚀',
    rarity: 'Epic',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'chapter-5' },
    reward: { type: 'xp', value: 250 },
  },
  {
    id: 'chapter-finale',
    name: 'Chronicle Complete',
    description: 'Finish the entire Web3 Chaos Chronicles',
    icon: '👑',
    rarity: 'Legendary',
    category: 'story',
    unlockCondition: { type: 'chapter', value: 'finale' },
    reward: { type: 'xp', value: 500 },
  },
  
  // Character Unlock Achievements
  {
    id: 'unlock-sam',
    name: "Skeptic's Approval",
    description: 'Unlock Sam the Skeptic',
    icon: '🛡️',
    rarity: 'Common',
    category: 'character',
    unlockCondition: { type: 'character', value: 'sam' },
    reward: { type: 'xp', value: 75 },
  },
  {
    id: 'unlock-miko',
    name: "Artist's Vision",
    description: 'Unlock Miko the Artist',
    icon: '🎨',
    rarity: 'Rare',
    category: 'character',
    unlockCondition: { type: 'character', value: 'miko' },
    reward: { type: 'xp', value: 100 },
  },
  {
    id: 'unlock-ollie',
    name: 'Gamer Mode Activated',
    description: 'Unlock Ollie the Gamer',
    icon: '🎮',
    rarity: 'Rare',
    category: 'character',
    unlockCondition: { type: 'character', value: 'ollie' },
    reward: { type: 'xp', value: 100 },
  },
  {
    id: 'unlock-lila',
    name: 'Community Champion',
    description: 'Unlock Lila the Connector',
    icon: '🤝',
    rarity: 'Epic',
    category: 'character',
    unlockCondition: { type: 'character', value: 'lila' },
    reward: { type: 'xp', value: 150 },
  },
  {
    id: 'unlock-collective',
    name: 'United We Stand',
    description: 'Unlock The Collective',
    icon: '🌟',
    rarity: 'Legendary',
    category: 'character',
    unlockCondition: { type: 'character', value: 'collective' },
    reward: { type: 'xp', value: 300 },
  },
  
  // Mastery Achievements
  {
    id: 'book1-mastery',
    name: 'Block Expert',
    description: 'Score 500+ in all Book 1 games',
    icon: '⭐',
    rarity: 'Rare',
    category: 'mastery',
    unlockCondition: { type: 'book', value: 1 },
    reward: { type: 'xp', value: 200 },
  },
  {
    id: 'book2-mastery',
    name: 'Security Specialist',
    description: 'Score 500+ in all Book 2 games',
    icon: '⭐',
    rarity: 'Rare',
    category: 'mastery',
    unlockCondition: { type: 'book', value: 2 },
    reward: { type: 'xp', value: 200 },
  },
  {
    id: 'book3-mastery',
    name: 'Token Tycoon',
    description: 'Score 500+ in all Book 3 games',
    icon: '⭐',
    rarity: 'Epic',
    category: 'mastery',
    unlockCondition: { type: 'book', value: 3 },
    reward: { type: 'xp', value: 250 },
  },
  {
    id: 'book4-mastery',
    name: 'NFT Connoisseur',
    description: 'Score 500+ in all Book 4 games',
    icon: '⭐',
    rarity: 'Epic',
    category: 'mastery',
    unlockCondition: { type: 'book', value: 4 },
    reward: { type: 'xp', value: 250 },
  },
  {
    id: 'book5-mastery',
    name: 'Web3 Pioneer',
    description: 'Score 500+ in all Book 5 games',
    icon: '⭐',
    rarity: 'Legendary',
    category: 'mastery',
    unlockCondition: { type: 'book', value: 5 },
    reward: { type: 'xp', value: 300 },
  },
  
  // Collection Achievements
  {
    id: 'all-games-played',
    name: 'Game Explorer',
    description: 'Play all 15 games at least once',
    icon: '🗺️',
    rarity: 'Rare',
    category: 'collection',
    unlockCondition: { type: 'games', value: 15 },
    reward: { type: 'xp', value: 200 },
  },
  {
    id: 'total-score-5000',
    name: 'Point Collector',
    description: 'Earn 5,000 total points across all games',
    icon: '💰',
    rarity: 'Rare',
    category: 'collection',
    unlockCondition: { type: 'score', value: 5000 },
    reward: { type: 'xp', value: 150 },
  },
  {
    id: 'total-score-10000',
    name: 'Point Hoarder',
    description: 'Earn 10,000 total points across all games',
    icon: '💎',
    rarity: 'Epic',
    category: 'collection',
    unlockCondition: { type: 'score', value: 10000 },
    reward: { type: 'xp', value: 250 },
  },
  {
    id: 'reach-level-10',
    name: 'Dedicated Player',
    description: 'Reach player level 10',
    icon: '🏅',
    rarity: 'Rare',
    category: 'collection',
    unlockCondition: { type: 'level', value: 10 },
    reward: { type: 'xp', value: 200 },
  },
  {
    id: 'reach-level-25',
    name: 'Blockchain Veteran',
    description: 'Reach player level 25',
    icon: '🏆',
    rarity: 'Epic',
    category: 'collection',
    unlockCondition: { type: 'level', value: 25 },
    reward: { type: 'xp', value: 400 },
  },
];

// Helper to check if an achievement is unlocked
export const checkAchievementUnlocked = (
  achievement: StoryAchievement,
  unlockedChapters: string[],
  unlockedCharacters: string[],
  highScores: Record<string, number>,
  playerLevel: number
): boolean => {
  const { type, value } = achievement.unlockCondition;
  
  switch (type) {
    case 'chapter':
      return unlockedChapters.includes(value as string);
    
    case 'character':
      return unlockedCharacters.includes(value as string);
    
    case 'book': {
      const bookGames = getGamesByBook(value as number);
      return bookGames.every(game => (highScores[game.gameId] || 0) >= 500);
    }
    
    case 'games': {
      const playedGames = Object.keys(highScores).filter(k => highScores[k] > 0);
      return playedGames.length >= (value as number);
    }
    
    case 'score': {
      const totalScore = Object.values(highScores).reduce((sum, s) => sum + s, 0);
      return totalScore >= (value as number);
    }
    
    case 'level':
      return playerLevel >= (value as number);
    
    default:
      return false;
  }
};

// Hook to get achievement status
export const useStoryAchievements = () => {
  const { unlockedStoryChapters, unlockedCharacterIds } = useCharacterStore();
  const { highScores, profile } = useGameStore();
  
  const getUnlockedAchievements = (): StoryAchievement[] => {
    return STORY_ACHIEVEMENTS.filter(achievement => 
      checkAchievementUnlocked(
        achievement,
        unlockedStoryChapters,
        unlockedCharacterIds,
        highScores,
        profile?.level || 1
      )
    );
  };
  
  const getLockedAchievements = (): StoryAchievement[] => {
    return STORY_ACHIEVEMENTS.filter(achievement => 
      !checkAchievementUnlocked(
        achievement,
        unlockedStoryChapters,
        unlockedCharacterIds,
        highScores,
        profile?.level || 1
      )
    );
  };
  
  const getAchievementProgress = (achievement: StoryAchievement): number => {
    const { type, value } = achievement.unlockCondition;
    
    switch (type) {
      case 'chapter':
        return unlockedStoryChapters.includes(value as string) ? 100 : 0;
      
      case 'character':
        return unlockedCharacterIds.includes(value as string) ? 100 : 0;
      
      case 'book': {
        const bookGames = getGamesByBook(value as number);
        const completed = bookGames.filter(g => (highScores[g.gameId] || 0) >= 500).length;
        return Math.round((completed / bookGames.length) * 100);
      }
      
      case 'games': {
        const playedGames = Object.keys(highScores).filter(k => highScores[k] > 0);
        return Math.min(100, Math.round((playedGames.length / (value as number)) * 100));
      }
      
      case 'score': {
        const totalScore = Object.values(highScores).reduce((sum, s) => sum + s, 0);
        return Math.min(100, Math.round((totalScore / (value as number)) * 100));
      }
      
      case 'level':
        return Math.min(100, Math.round(((profile?.level || 1) / (value as number)) * 100));
      
      default:
        return 0;
    }
  };
  
  const getTotalProgress = (): number => {
    const unlocked = getUnlockedAchievements().length;
    return Math.round((unlocked / STORY_ACHIEVEMENTS.length) * 100);
  };
  
  return {
    achievements: STORY_ACHIEVEMENTS,
    unlockedAchievements: getUnlockedAchievements(),
    lockedAchievements: getLockedAchievements(),
    getProgress: getAchievementProgress,
    totalProgress: getTotalProgress(),
    totalUnlocked: getUnlockedAchievements().length,
    totalAchievements: STORY_ACHIEVEMENTS.length,
  };
};

// Get rarity color
export const getAchievementRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'Legendary': return '#BF00FF';
    case 'Epic': return '#FFD700';
    case 'Rare': return '#00CED1';
    default: return '#888888';
  }
};

// Check and award achievements after game completion
// Returns array of newly unlocked achievements
export const checkAndAwardStoryAchievements = async (
  gameId: string,
  score: number,
  gameStore: any,
  characterStore: any
): Promise<StoryAchievement[]> => {
  const { unlockedStoryChapters, unlockedCharacterIds } = characterStore.getState();
  const { highScores, profile, awardBadge } = gameStore.getState();
  
  const newlyUnlocked: StoryAchievement[] = [];
  
  // Get all achievements that should now be unlocked
  for (const achievement of STORY_ACHIEVEMENTS) {
    const wasUnlocked = checkAchievementUnlocked(
      achievement,
      unlockedStoryChapters,
      unlockedCharacterIds,
      highScores,
      profile?.level || 1
    );
    
    // Skip if already unlocked and badge awarded
    const alreadyHasBadge = profile?.badges?.some(
      (b: any) => b.id === `story-${achievement.id}`
    );
    
    if (wasUnlocked && !alreadyHasBadge) {
      // Award the badge through game store
      try {
        await awardBadge({
          id: `story-${achievement.id}`,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          gameId: 'story-progress',
          earnedAt: Date.now(),
        });
        newlyUnlocked.push(achievement);
        
        // Award XP reward if applicable
        if (achievement.reward?.type === 'xp') {
          gameStore.getState().addXP(achievement.reward.value as number);
        }
      } catch (e) {
        console.warn('Failed to award story achievement:', achievement.name);
      }
    }
  }
  
  return newlyUnlocked;
};

// Simplified function to call from game completion
export const processGameCompletion = async (
  gameId: string,
  score: number
): Promise<{ achievements: StoryAchievement[]; chaptersUnlocked: boolean }> => {
  // Dynamically import stores to avoid circular dependencies
  const { useGameStore } = await import('../store/gameStore');
  const { useCharacterStore } = await import('../store/characterStore');
  const { getStoryMappingByGameId } = await import('../constants/storyMapping');
  
  const gameStore = useGameStore;
  const characterStore = useCharacterStore;
  
  // Check if this game unlocks a chapter
  const storyMapping = getStoryMappingByGameId(gameId);
  let chaptersUnlocked = false;
  
  if (storyMapping && score > 0) {
    // Unlock the chapter in character store
    characterStore.getState().unlockStoryChapter(storyMapping.gameId);
    chaptersUnlocked = true;
    
    // Check if character should be unlocked
    const { unlockedCharacterIds, unlockedStoryChapters } = characterStore.getState();
    const totalChapters = unlockedStoryChapters.length;
    
    // Unlock characters based on progress
    if (totalChapters >= 3 && !unlockedCharacterIds.includes('kira')) {
      characterStore.getState().unlockCharacter('kira');
    }
    if (totalChapters >= 6 && !unlockedCharacterIds.includes('rex')) {
      characterStore.getState().unlockCharacter('rex');
    }
    if (totalChapters >= 9 && !unlockedCharacterIds.includes('nova')) {
      characterStore.getState().unlockCharacter('nova');
    }
    if (totalChapters >= 12 && !unlockedCharacterIds.includes('max')) {
      characterStore.getState().unlockCharacter('max');
    }
  }
  
  // Check and award story achievements
  const achievements = await checkAndAwardStoryAchievements(
    gameId,
    score,
    gameStore,
    characterStore
  );
  
  return { achievements, chaptersUnlocked };
};
