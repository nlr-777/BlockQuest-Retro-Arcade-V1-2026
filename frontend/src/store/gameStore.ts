// Block Quest Official - Game State Store
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../components/Toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  gameId: string;
  mintedAt: number;
  traits: Record<string, string | number>;
  icon: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  avatarId: string;
  createdAt: number;
  totalScore: number;
  gamesPlayed: number;
  badges: Badge[];
  daoVotingPower: number;
  level: number;
  xp: number;
  unlockedStoryBadges?: string[];  // Story/achievement badges unlocked
  achievements?: string[];          // General achievements
}

export interface GameScore {
  gameId: string;
  score: number;
  playedAt: number;
  duration: number;
}

interface GameState {
  // Player
  profile: PlayerProfile | null;
  isLoading: boolean;
  
  // Audio
  isMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  
  // VFX
  vfxEnabled: boolean;
  vfxIntensity: number;
  
  // Scores
  highScores: Record<string, number>;
  recentScores: GameScore[];
  
  // Hydration tracking
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions
  initProfile: (username: string, avatarId?: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  loadCloudProfile: (cloudData: {
    username: string;
    characterId: string;
    xp: number;
    level: number;
    highScores: Record<string, number>;
    badges: any[];
    unlockedStoryBadges: string[];
  }) => void;
  updateScore: (gameId: string, score: number, duration: number) => Promise<void>;
  mintBadge: (badge: Omit<Badge, 'id' | 'mintedAt'>) => Promise<Badge>;
  toggleMute: () => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  toggleVfx: () => void;
  setVfxIntensity: (intensity: number) => void;
  addXP: (amount: number) => void;
  addVotingPower: (amount: number) => void;
  submitScore: (gameId: string, score: number) => Promise<void>;
  addBadge: (badge: Omit<Badge, 'id' | 'mintedAt'>) => Promise<Badge>;
  logout: () => Promise<void>;
  resetAllData: () => Promise<void>;
  resetProfile: () => void;
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
        console.warn('Storage getItem error:', e);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      if (!isClient()) return;
      try {
        await AsyncStorage.setItem(name, value);
      } catch (e) {
        console.warn('Storage setItem error:', e);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      if (!isClient()) return;
      try {
        await AsyncStorage.removeItem(name);
      } catch (e) {
        console.warn('Storage removeItem error:', e);
      }
    },
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: true,
      isMuted: false,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      vfxEnabled: true,
      vfxIntensity: 1,
      highScores: {},
      recentScores: [],
      
      // Hydration tracking
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      initProfile: async (username: string, avatarId: string = 'cyber-punk') => {
        const newProfile: PlayerProfile = {
          id: `player_${Date.now()}`,
          username,
          avatarId,
          createdAt: Date.now(),
          totalScore: 0,
          gamesPlayed: 0,
          badges: [],
          daoVotingPower: 0,
          level: 1,
          xp: 0,
        };
        set({ profile: newProfile, isLoading: false });
      },

      loadProfile: async () => {
        // With persist middleware, profile is auto-loaded on hydration
        // This function now just marks loading as complete
        set({ isLoading: false });
      },

      updateScore: async (gameId: string, score: number, duration: number) => {
        const { profile, highScores, recentScores, mintBadge } = get();
        if (!profile) return;

        const newHighScores = { ...highScores };
        const isNewHighScore = !newHighScores[gameId] || score > newHighScores[gameId];
        if (isNewHighScore) {
          newHighScores[gameId] = score;
        }

        const newScore: GameScore = {
          gameId,
          score,
          playedAt: Date.now(),
          duration,
        };

        const newGamesPlayed = profile.gamesPlayed + 1;
        
        // Calculate XP earned: base 10 + score/10 (capped at 50)
        const xpEarned = Math.min(50, 10 + Math.floor(score / 10));
        const newXP = profile.xp + xpEarned;
        
        // Calculate new level (100 XP per level)
        const xpPerLevel = 100;
        const newLevel = Math.floor(newXP / xpPerLevel) + 1;
        
        const updatedProfile = {
          ...profile,
          totalScore: profile.totalScore + score,
          gamesPlayed: newGamesPlayed,
          xp: newXP,
          level: newLevel,
        };

        // Update state - persist middleware will auto-save
        set({
          profile: updatedProfile,
          highScores: newHighScores,
          recentScores: [newScore, ...recentScores.slice(0, 19)],
        });

        // Show toast for new high score
        if (isNewHighScore) {
          showToast(`🏆 New High Score: ${score}!`, 'success');
        }
        
        // Show toast for level up
        if (newLevel > profile.level) {
          showToast(`🎉 Level Up! You're now Level ${newLevel}!`, 'success');
        }

        // Award "Beginner" badge after 5 total plays
        const hasBeginnerBadge = profile.badges.some(b => b.id.includes('beginner_badge'));
        if (newGamesPlayed >= 5 && !hasBeginnerBadge) {
          await mintBadge({
            name: 'Arcade Rookie',
            description: 'Played 5 games in the BlockQuest Arcade!',
            rarity: 'Common',
        gameId: 'arcade',
        traits: { gamesPlayed: 5 },
        icon: '🎮',
      });
    }

    return isNewHighScore;
  },

  mintBadge: async (badgeData) => {
    const { profile } = get();
    if (!profile) throw new Error('No profile');

    const badge: Badge = {
      ...badgeData,
      id: `badge_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      mintedAt: Date.now(),
    };

    // Show toast for new badge
    showToast(`🏅 Badge Earned: ${badgeData.name}!`, 'success');

    const updatedProfile = {
      ...profile,
      badges: [...profile.badges, badge],
      daoVotingPower: profile.daoVotingPower + (badge.rarity === 'Legendary' ? 10 : badge.rarity === 'Epic' ? 5 : badge.rarity === 'Rare' ? 2 : 1),
    };

    // Update state - persist middleware will auto-save
    set({ profile: updatedProfile });
    
    return badge;
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setMusicVolume: (vol) => set({ musicVolume: vol }),
  setSfxVolume: (vol) => set({ sfxVolume: vol }),
  toggleVfx: () => set((s) => ({ vfxEnabled: !s.vfxEnabled })),
  setVfxIntensity: (intensity) => set({ vfxIntensity: intensity }),
  
  addXP: (amount) => {
    const { profile } = get();
    if (!profile) return;
    
    const newXP = profile.xp + amount;
    const xpPerLevel = 100;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    
    const updatedProfile = {
      ...profile,
      xp: newXP,
      level: newLevel,
    };
    
    // Update state - persist middleware will auto-save
    set({ profile: updatedProfile });
  },
  
  addVotingPower: (amount) => {
    const { profile } = get();
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      daoVotingPower: profile.daoVotingPower + amount,
    };
    
    // Update state - persist middleware will auto-save
    set({ profile: updatedProfile });
  },

  // Simplified submitScore for games to call
  submitScore: async (gameId: string, score: number) => {
    const { updateScore } = get();
    await updateScore(gameId, score, 0);
  },

  // Alias for mintBadge for backwards compatibility  
  addBadge: async (badgeData) => {
    const { mintBadge } = get();
    return mintBadge(badgeData);
  },

  // Load profile data from cloud (after login on new device)
  loadCloudProfile: (cloudData: {
    username: string;
    characterId: string;
    xp: number;
    level: number;
    highScores: Record<string, number>;
    badges: any[];
    unlockedStoryBadges: string[];
    gamesPlayed?: number;
    totalScore?: number;
    daoVotingPower?: number;
    achievements?: string[];
    recentScores?: any[];
  }) => {
    const { profile, highScores: localHighScores, recentScores: localRecent } = get();
    
    // Merge high scores - keep the higher of local vs cloud for each game
    const mergedHighScores: Record<string, number> = { ...localHighScores };
    Object.entries(cloudData.highScores || {}).forEach(([gameId, cloudScore]) => {
      if (!mergedHighScores[gameId] || cloudScore > mergedHighScores[gameId]) {
        mergedHighScores[gameId] = cloudScore;
      }
    });
    
    // Merge recent scores
    const mergedRecent = [...(cloudData.recentScores || []), ...(localRecent || [])];
    const seenTimes = new Set();
    const uniqueRecent = mergedRecent.filter((s: any) => {
      if (seenTimes.has(s.playedAt)) return false;
      seenTimes.add(s.playedAt);
      return true;
    }).sort((a: any, b: any) => b.playedAt - a.playedAt).slice(0, 20);
    
    // Create or update profile with cloud data
    const updatedProfile: PlayerProfile = {
      id: profile?.id || `player_${Date.now()}`,
      username: cloudData.username,
      avatarId: cloudData.characterId,
      createdAt: profile?.createdAt || Date.now(),
      totalScore: Math.max(cloudData.totalScore || 0, profile?.totalScore || 0),
      gamesPlayed: Math.max(cloudData.gamesPlayed || 0, profile?.gamesPlayed || 0),
      badges: cloudData.badges || profile?.badges || [],
      daoVotingPower: Math.max(cloudData.daoVotingPower || 0, profile?.daoVotingPower || 0),
      level: Math.max(cloudData.level, profile?.level || 1),
      xp: Math.max(cloudData.xp, profile?.xp || 0),
      unlockedStoryBadges: [...new Set([
        ...(cloudData.unlockedStoryBadges || []),
        ...(profile?.unlockedStoryBadges || [])
      ])],
      achievements: [...new Set([
        ...(cloudData.achievements || []),
        ...(profile?.achievements || [])
      ])],
    };
    
    set({
      profile: updatedProfile,
      highScores: mergedHighScores,
      recentScores: uniqueRecent,
      isLoading: false,
    });
  },

  // Logout - save progress but clear session (user can restore later)
  logout: async () => {
    // Progress is already saved in AsyncStorage - we just clear the active session
    // User can restore using seed phrase or by logging back in
    set({
      profile: null,
      isLoading: false,
      // Keep highScores and recentScores in memory until app restarts
    });
  },

  // Full data reset - clears everything permanently
  resetAllData: async () => {
    set({
      profile: null,
      isLoading: false,
      highScores: {},
      recentScores: [],
    });
  },
}),
    {
      name: 'blockquest-game-storage',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      // Persist essential game data
      partialize: (state) => ({
        profile: state.profile,
        highScores: state.highScores,
        recentScores: state.recentScores,
        isMuted: state.isMuted,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        vfxEnabled: state.vfxEnabled,
        vfxIntensity: state.vfxIntensity,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate game store:', error);
        }
        useGameStore.setState({ _hasHydrated: true, isLoading: false });
      },
    }
  )
);

// Helper hook to check if store has hydrated
export const useGameStoreHydrated = () => useGameStore(state => state._hasHydrated);
