// BlockQuest Official - Character Store
// Manages character unlocks, selection, and progression

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHARACTERS, CharacterConfig, getCharacterById } from '../constants/characters';

export interface CharacterProgress {
  characterId: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  totalScore: number;
  unlockedAt?: number;
}

interface CharacterState {
  // Selected character for gameplay
  selectedCharacterId: string;
  
  // Unlocked characters
  unlockedCharacterIds: string[];
  
  // Character-specific progress
  characterProgress: Record<string, CharacterProgress>;
  
  // Story chapters unlocked
  unlockedStoryChapters: string[];
  
  // Hydration tracking
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions
  selectCharacter: (characterId: string) => void;
  unlockCharacter: (characterId: string) => void;
  addCharacterXP: (characterId: string, xp: number) => void;
  recordCharacterGame: (characterId: string, score: number) => void;
  unlockStoryChapter: (chapterId: string) => void;
  
  // Queries
  isCharacterUnlocked: (characterId: string) => boolean;
  getSelectedCharacter: () => CharacterConfig | undefined;
  canUnlockCharacter: (characterId: string, playerStats: PlayerStats) => boolean;
  getCharacterLevel: (characterId: string) => number;
  checkAndUnlockCharacters: (playerStats: PlayerStats) => string[]; // Returns newly unlocked character IDs
}

// Player stats interface for unlock checking
export interface PlayerStats {
  totalScore: number;
  gamesPlayed: number;
  level: number;
  uniqueGamesCompleted: number;
  unlockedCharacterCount: number;
}

// Helper to check if we're on the client side
const isClient = () => typeof window !== 'undefined';

// SSR-safe storage wrapper
const createSSRSafeStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      if (!isClient()) return null;
      try {
        return await AsyncStorage.getItem(name);
      } catch (e) {
        console.warn('CharacterStore getItem error:', e);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      if (!isClient()) return;
      try {
        await AsyncStorage.setItem(name, value);
      } catch (e) {
        console.warn('CharacterStore setItem error:', e);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      if (!isClient()) return;
      try {
        await AsyncStorage.removeItem(name);
      } catch (e) {
        console.warn('CharacterStore removeItem error:', e);
      }
    },
  };
};

// XP required per character level
const XP_PER_LEVEL = 100;

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      // Default to Zara (starter character)
      selectedCharacterId: 'zara',
      
      // Zara is unlocked by default
      unlockedCharacterIds: ['zara'],
      
      // Character progress
      characterProgress: {
        zara: {
          characterId: 'zara',
          xp: 0,
          level: 1,
          gamesPlayed: 0,
          totalScore: 0,
          unlockedAt: Date.now(),
        },
      },
      
      // Story chapters
      unlockedStoryChapters: ['chapter-0'], // Chapter 0 is the intro
      
      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Select a character (must be unlocked)
      selectCharacter: (characterId: string) => {
        const { unlockedCharacterIds } = get();
        if (unlockedCharacterIds.includes(characterId)) {
          set({ selectedCharacterId: characterId });
        }
      },
      
      // Unlock a character
      unlockCharacter: (characterId: string) => {
        const { unlockedCharacterIds, characterProgress } = get();
        
        if (unlockedCharacterIds.includes(characterId)) {
          return; // Already unlocked
        }
        
        const newProgress: CharacterProgress = {
          characterId,
          xp: 0,
          level: 1,
          gamesPlayed: 0,
          totalScore: 0,
          unlockedAt: Date.now(),
        };
        
        set({
          unlockedCharacterIds: [...unlockedCharacterIds, characterId],
          characterProgress: {
            ...characterProgress,
            [characterId]: newProgress,
          },
        });
      },
      
      // Add XP to a character
      addCharacterXP: (characterId: string, xp: number) => {
        const { characterProgress } = get();
        const progress = characterProgress[characterId];
        
        if (!progress) return;
        
        const newXP = progress.xp + xp;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
        
        set({
          characterProgress: {
            ...characterProgress,
            [characterId]: {
              ...progress,
              xp: newXP,
              level: newLevel,
            },
          },
        });
      },
      
      // Record a game played with a character
      recordCharacterGame: (characterId: string, score: number) => {
        const { characterProgress } = get();
        const progress = characterProgress[characterId];
        
        if (!progress) return;
        
        // Calculate XP earned from score (10 base + score/10, capped at 50)
        const xpEarned = Math.min(50, 10 + Math.floor(score / 10));
        const newXP = progress.xp + xpEarned;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
        
        set({
          characterProgress: {
            ...characterProgress,
            [characterId]: {
              ...progress,
              xp: newXP,
              level: newLevel,
              gamesPlayed: progress.gamesPlayed + 1,
              totalScore: progress.totalScore + score,
            },
          },
        });
      },
      
      // Unlock a story chapter
      unlockStoryChapter: (chapterId: string) => {
        const { unlockedStoryChapters } = get();
        if (!unlockedStoryChapters.includes(chapterId)) {
          set({ unlockedStoryChapters: [...unlockedStoryChapters, chapterId] });
        }
      },
      
      // Check if character is unlocked
      isCharacterUnlocked: (characterId: string) => {
        const { unlockedCharacterIds } = get();
        return unlockedCharacterIds.includes(characterId);
      },
      
      // Get selected character config
      getSelectedCharacter: () => {
        const { selectedCharacterId } = get();
        return getCharacterById(selectedCharacterId);
      },
      
      // Check if player can unlock a character
      canUnlockCharacter: (characterId: string, playerStats: PlayerStats) => {
        const character = getCharacterById(characterId);
        if (!character) return false;
        
        const { unlockRequirement } = character;
        
        switch (unlockRequirement.type) {
          case 'default':
            return true;
          case 'points':
            return playerStats.totalScore >= unlockRequirement.value;
          case 'games':
            return playerStats.uniqueGamesCompleted >= unlockRequirement.value;
          case 'level':
            return playerStats.level >= unlockRequirement.value;
          case 'characters':
            // Exclude the collective itself from count
            const mainCharactersUnlocked = playerStats.unlockedCharacterCount;
            return mainCharactersUnlocked >= unlockRequirement.value;
          default:
            return false;
        }
      },
      
      // Get character level
      getCharacterLevel: (characterId: string) => {
        const { characterProgress } = get();
        return characterProgress[characterId]?.level || 1;
      },
      
      // Check and auto-unlock characters based on player stats
      checkAndUnlockCharacters: (playerStats: PlayerStats) => {
        const { unlockedCharacterIds, canUnlockCharacter, unlockCharacter } = get();
        const newlyUnlocked: string[] = [];
        
        // Check each character
        CHARACTERS.forEach(character => {
          if (!unlockedCharacterIds.includes(character.id)) {
            // Update stats with current unlock count for collective check
            const updatedStats = {
              ...playerStats,
              unlockedCharacterCount: unlockedCharacterIds.length + newlyUnlocked.length,
            };
            
            if (canUnlockCharacter(character.id, updatedStats)) {
              unlockCharacter(character.id);
              newlyUnlocked.push(character.id);
            }
          }
        });
        
        return newlyUnlocked;
      },
    }),
    {
      name: 'blockquest-character-storage',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      partialize: (state) => ({
        selectedCharacterId: state.selectedCharacterId,
        unlockedCharacterIds: state.unlockedCharacterIds,
        characterProgress: state.characterProgress,
        unlockedStoryChapters: state.unlockedStoryChapters,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate character store:', error);
        }
        useCharacterStore.setState({ _hasHydrated: true });
      },
    }
  )
);

// Helper hook to check if store has hydrated
export const useCharacterStoreHydrated = () => useCharacterStore(state => state._hasHydrated);
