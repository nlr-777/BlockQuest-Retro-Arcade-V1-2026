// Block Quest Official - Game State Store
import { create } from 'zustand';
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
}

const STORAGE_KEY = '@blockquest_profile';
const SCORES_KEY = '@blockquest_scores';

export const useGameStore = create<GameState>((set, get) => ({
  profile: null,
  isLoading: true,
  isMuted: false,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  vfxEnabled: true,
  vfxIntensity: 1,
  highScores: {},
  recentScores: [],

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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    set({ profile: newProfile, isLoading: false });
  },

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const scores = await AsyncStorage.getItem(SCORES_KEY);
      if (stored) {
        set({ 
          profile: JSON.parse(stored), 
          isLoading: false,
          highScores: scores ? JSON.parse(scores) : {},
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
      set({ isLoading: false });
    }
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

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(newHighScores));

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

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
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
    
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    set({ profile: updatedProfile });
  },
  
  addVotingPower: (amount) => {
    const { profile } = get();
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      daoVotingPower: profile.daoVotingPower + amount,
    };
    
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
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
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(SCORES_KEY);
    set({
      profile: null,
      isLoading: false,
      highScores: {},
      recentScores: [],
    });
  },
}));
