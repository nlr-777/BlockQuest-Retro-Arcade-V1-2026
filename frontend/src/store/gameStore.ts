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

  initProfile: async (username: string) => {
    const newProfile: PlayerProfile = {
      id: `player_${Date.now()}`,
      username,
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
    const { profile, highScores, recentScores } = get();
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

    const updatedProfile = {
      ...profile,
      totalScore: profile.totalScore + score,
      gamesPlayed: profile.gamesPlayed + 1,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(newHighScores));

    set({
      profile: updatedProfile,
      highScores: newHighScores,
      recentScores: [newScore, ...recentScores.slice(0, 19)],
    });

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
}));
