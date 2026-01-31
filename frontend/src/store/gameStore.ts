// Block Quest Official - Game State Store
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  gameId: string;
  mintedAt: number;
  traits: Record<string, string | number>;
  icon: string;
  category?: 'token' | 'nft' | 'web3' | 'meta' | 'game' | 'story';
}

export interface DaoVote {
  id: string;
  proposalId: string;
  proposalTitle: string;
  vote: 'yes' | 'no' | 'abstain';
  votedAt: number;
  votingPower: number;
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
  // New currencies
  knowledgeTokens: number;
  questCoins: number;
  // DAO voting history
  daoVotes: DaoVote[];
  // Story Mode progress
  completedStoryEpisodes: string[];
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
  // New currency actions
  addKnowledgeTokens: (amount: number) => void;
  addQuestCoins: (amount: number) => void;
  spendQuestCoins: (amount: number) => boolean;
  // DAO voting
  castDaoVote: (proposalId: string, proposalTitle: string, vote: 'yes' | 'no' | 'abstain') => void;
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
          daoVotingPower: 10, // Starting voting power
          level: 1,
          xp: 0,
          knowledgeTokens: 0,
          questCoins: 100, // Starting coins
          daoVotes: [],
          completedStoryEpisodes: [],
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

  // Add Knowledge Tokens (earned from educational activities)
  addKnowledgeTokens: (amount: number) => {
    const { profile } = get();
    if (!profile) return;
    
    const currentTokens = profile.knowledgeTokens || 0;
    const updatedProfile = {
      ...profile,
      knowledgeTokens: currentTokens + amount,
    };
    set({ profile: updatedProfile });
  },

  // Add Quest Coins (earned from gameplay)
  addQuestCoins: (amount: number) => {
    const { profile } = get();
    if (!profile) return;
    
    const currentCoins = profile.questCoins || 0;
    const updatedProfile = {
      ...profile,
      questCoins: currentCoins + amount,
    };
    set({ profile: updatedProfile });
  },

  // Spend Quest Coins (returns false if not enough)
  spendQuestCoins: (amount: number) => {
    const { profile } = get();
    if (!profile) return false;
    
    const currentCoins = profile.questCoins || 0;
    if (currentCoins < amount) return false;
    
    const updatedProfile = {
      ...profile,
      questCoins: currentCoins - amount,
    };
    set({ profile: updatedProfile });
    return true;
  },

  // Cast a DAO vote on a proposal
  castDaoVote: (proposalId: string, proposalTitle: string, vote: 'yes' | 'no' | 'abstain') => {
    const { profile } = get();
    if (!profile) return;
    
    // Check if already voted on this proposal
    const existingVotes = profile.daoVotes || [];
    if (existingVotes.some(v => v.proposalId === proposalId)) {
      console.warn('Already voted on this proposal');
      return;
    }
    
    const newVote: DaoVote = {
      id: `vote_${Date.now()}`,
      proposalId,
      proposalTitle,
      vote,
      votedAt: Date.now(),
      votingPower: profile.daoVotingPower,
    };
    
    const updatedProfile = {
      ...profile,
      daoVotes: [...existingVotes, newVote],
    };
    set({ profile: updatedProfile });
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
