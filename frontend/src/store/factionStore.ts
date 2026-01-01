// BlockQuest Official - Factions System
// 4 Factions for community competition and bonus XP rewards

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The 4 Factions
export const FACTIONS = {
  miners: {
    id: 'miners',
    name: 'Pixel Miners',
    icon: '⛏️',
    color: '#F59E0B', // Gold
    description: 'Dig deep, earn big! Mining games are our specialty.',
    motto: 'Every pixel counts!',
    bonusGames: ['mine-blaster', 'hash-hopper'],
    xpBonus: 10, // 10% bonus XP in faction-bonus games
  },
  builders: {
    id: 'builders',
    name: 'Neon Builders',
    icon: '🏗️',
    color: '#3B82F6', // Blue
    description: 'Stack, build, construct! We make blocks beautiful.',
    motto: 'Build the future!',
    bonusGames: ['token-tumble', 'block-muncher'],
    xpBonus: 10,
  },
  validators: {
    id: 'validators',
    name: 'Glow Validators',
    icon: '✅',
    color: '#10B981', // Green
    description: 'Verify, validate, secure! Trust is our foundation.',
    motto: 'Consensus is key!',
    bonusGames: ['chain-invaders', 'dao-duel'],
    xpBonus: 10,
  },
  explorers: {
    id: 'explorers',
    name: 'Quest Explorers',
    icon: '🧭',
    color: '#8B5CF6', // Purple
    description: 'Adventure awaits! Every game is a new quest.',
    motto: 'Never stop exploring!',
    bonusGames: ['quest-vault', 'seed-sprint', 'crypto-climber'],
    xpBonus: 10,
  },
};

export type FactionId = keyof typeof FACTIONS;

export interface FactionMember {
  id: string;
  username: string;
  xpContributed: number;
  joinedAt: number;
}

export interface FactionStats {
  totalXP: number;
  totalMembers: number;
  weeklyXP: number;
  rank: number;
}

interface FactionState {
  // Player's faction
  playerFaction: FactionId | null;
  joinedAt: number | null;
  xpContributed: number;
  
  // Faction stats (mock data for now)
  factionStats: Record<FactionId, FactionStats>;
  
  // Actions
  joinFaction: (factionId: FactionId, playerId: string, username: string) => void;
  contributeXP: (amount: number) => void;
  getFactionBonus: (gameId: string) => number;
  leaveFaction: () => void;
  
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// SSR-safe storage
const isClient = () => typeof window !== 'undefined';

const createSSRSafeStorage = (): StateStorage => ({
  getItem: async (name) => {
    if (!isClient()) return null;
    try { return await AsyncStorage.getItem(name); } 
    catch { return null; }
  },
  setItem: async (name, value) => {
    if (!isClient()) return;
    try { await AsyncStorage.setItem(name, value); } 
    catch {}
  },
  removeItem: async (name) => {
    if (!isClient()) return;
    try { await AsyncStorage.removeItem(name); } 
    catch {}
  },
});

// Initial mock faction stats
const initialFactionStats: Record<FactionId, FactionStats> = {
  miners: { totalXP: 125000, totalMembers: 342, weeklyXP: 15200, rank: 2 },
  builders: { totalXP: 148000, totalMembers: 389, weeklyXP: 18500, rank: 1 },
  validators: { totalXP: 98000, totalMembers: 267, weeklyXP: 12100, rank: 3 },
  explorers: { totalXP: 87000, totalMembers: 234, weeklyXP: 9800, rank: 4 },
};

export const useFactionStore = create<FactionState>()(
  persist(
    (set, get) => ({
      playerFaction: null,
      joinedAt: null,
      xpContributed: 0,
      factionStats: initialFactionStats,
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      joinFaction: (factionId, playerId, username) => {
        set({
          playerFaction: factionId,
          joinedAt: Date.now(),
          xpContributed: 0,
        });
        
        // Update faction stats (simulated)
        const { factionStats } = get();
        set({
          factionStats: {
            ...factionStats,
            [factionId]: {
              ...factionStats[factionId],
              totalMembers: factionStats[factionId].totalMembers + 1,
            },
          },
        });
      },
      
      contributeXP: (amount) => {
        const { playerFaction, xpContributed, factionStats } = get();
        if (!playerFaction) return;
        
        set({
          xpContributed: xpContributed + amount,
        });
        
        // Update faction stats
        set({
          factionStats: {
            ...factionStats,
            [playerFaction]: {
              ...factionStats[playerFaction],
              totalXP: factionStats[playerFaction].totalXP + amount,
              weeklyXP: factionStats[playerFaction].weeklyXP + amount,
            },
          },
        });
      },
      
      getFactionBonus: (gameId) => {
        const { playerFaction } = get();
        if (!playerFaction) return 0;
        
        const faction = FACTIONS[playerFaction];
        if (faction.bonusGames.includes(gameId)) {
          return faction.xpBonus; // Return bonus percentage
        }
        return 0;
      },
      
      leaveFaction: () => {
        const { playerFaction, factionStats } = get();
        if (!playerFaction) return;
        
        // Update faction stats
        set({
          factionStats: {
            ...factionStats,
            [playerFaction]: {
              ...factionStats[playerFaction],
              totalMembers: Math.max(0, factionStats[playerFaction].totalMembers - 1),
            },
          },
        });
        
        set({
          playerFaction: null,
          joinedAt: null,
          xpContributed: 0,
        });
      },
    }),
    {
      name: 'blockquest-faction-storage',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      partialize: (state) => ({
        playerFaction: state.playerFaction,
        joinedAt: state.joinedAt,
        xpContributed: state.xpContributed,
      }),
      onRehydrateStorage: () => () => {
        useFactionStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export default useFactionStore;
