// BlockQuest Official - Factions System
// 🎮 Off-chain DAOs in disguise - Learn governance without realizing!
// Kids learn: Voting, Proposals, Treasury, Collective Decision Making

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The 4 Factions - Each teaches different DAO concepts
export const FACTIONS = {
  miners: {
    id: 'miners',
    name: 'Pixel Miners',
    icon: '⛏️',
    color: '#F59E0B', // Gold
    description: 'Dig deep, earn big! We pool resources and share the rewards.',
    motto: 'Every pixel counts!',
    bonusGames: ['mine-blaster', 'hash-hopper'],
    xpBonus: 10,
    // DAO Learning: Treasury & Resource Pooling
    daoRole: 'Treasury Guardians',
    daoPerk: 'Pool XP together for bigger rewards!',
    daoLesson: 'In a DAO, members pool resources (like tokens) into a shared treasury that benefits everyone.',
  },
  builders: {
    id: 'builders',
    name: 'Neon Builders',
    icon: '🏗️',
    color: '#3B82F6', // Blue
    description: 'Stack, build, construct! We vote on what to build next.',
    motto: 'Build the future!',
    bonusGames: ['token-tumble', 'block-muncher'],
    xpBonus: 10,
    // DAO Learning: Proposals & Voting
    daoRole: 'Proposal Masters',
    daoPerk: 'Vote on weekly faction challenges!',
    daoLesson: 'In a DAO, members create and vote on proposals to decide what the group does.',
  },
  validators: {
    id: 'validators',
    name: 'Glow Validators',
    icon: '✅',
    color: '#10B981', // Green
    description: 'Verify, validate, secure! We ensure fairness for all.',
    motto: 'Consensus is key!',
    bonusGames: ['chain-invaders', 'dao-duel'],
    xpBonus: 10,
    // DAO Learning: Consensus & Verification
    daoRole: 'Consensus Keepers',
    daoPerk: 'Verify scores for bonus XP!',
    daoLesson: 'In a DAO, validators help verify that rules are followed and decisions are fair.',
  },
  explorers: {
    id: 'explorers',
    name: 'Quest Explorers',
    icon: '🧭',
    color: '#8B5CF6', // Purple
    description: 'Adventure awaits! We discover new quests together.',
    motto: 'Never stop exploring!',
    bonusGames: ['quest-vault', 'seed-sprint', 'crypto-climber'],
    xpBonus: 10,
    // DAO Learning: Delegation & Committees
    daoRole: 'Quest Scouts',
    daoPerk: 'Delegate quests to fellow explorers!',
    daoLesson: 'In a DAO, members can delegate tasks or voting power to trusted representatives.',
  },
};

export type FactionId = keyof typeof FACTIONS;

// Proposal system - teaches governance voting!
export interface FactionProposal {
  id: string;
  title: string;
  description: string;
  icon: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'rejected' | 'expired';
  reward?: string;
}

// Member contribution tracking
export interface FactionMember {
  id: string;
  username: string;
  xpContributed: number;
  joinedAt: number;
  votesParticipated: number;
  proposalsCreated: number;
  rank: 'Rookie' | 'Member' | 'Elder' | 'Champion' | 'Legend';
}

export interface FactionStats {
  totalXP: number;
  totalMembers: number;
  weeklyXP: number;
  rank: number;
  treasury: number; // Pooled XP (teaches treasury concept)
  activeProposals: number;
  totalVotes: number;
}

interface FactionState {
  // Player's faction
  playerFaction: FactionId | null;
  joinedAt: number | null;
  xpContributed: number;
  votesParticipated: number;
  memberRank: string;
  
  // Faction stats (mock data simulating active community)
  factionStats: Record<FactionId, FactionStats>;
  
  // Active proposals per faction (DAO governance!)
  proposals: Record<FactionId, FactionProposal[]>;
  
  // Player's votes
  playerVotes: Record<string, 'for' | 'against'>;
  
  // Actions
  joinFaction: (factionId: FactionId, playerId: string, username: string) => void;
  contributeXP: (amount: number) => void;
  getFactionBonus: (gameId: string) => number;
  leaveFaction: () => void;
  voteOnProposal: (proposalId: string, vote: 'for' | 'against') => void;
  donateToTreasury: (amount: number) => void;
  getMemberRank: () => string;
  
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

// Sample proposals - teaches kids about voting and governance!
const sampleProposals: Record<FactionId, FactionProposal[]> = {
  miners: [
    {
      id: 'prop_miners_1',
      title: '🎯 Double XP Weekend',
      description: 'Should we activate Double XP for all mining games this weekend?',
      icon: '⛏️',
      createdBy: 'GoldDigger99',
      createdAt: Date.now() - 86400000,
      expiresAt: Date.now() + 172800000,
      votesFor: 127,
      votesAgainst: 23,
      status: 'active',
      reward: '+50 XP for voting!',
    },
  ],
  builders: [
    {
      id: 'prop_builders_1',
      title: '🏆 New Badge Design',
      description: 'Vote on the new Builder Champion badge design!',
      icon: '🎨',
      createdBy: 'NeonMaster',
      createdAt: Date.now() - 43200000,
      expiresAt: Date.now() + 259200000,
      votesFor: 89,
      votesAgainst: 45,
      status: 'active',
      reward: '+25 XP for voting!',
    },
  ],
  validators: [
    {
      id: 'prop_validators_1',
      title: '✅ Verify Challenge Mode',
      description: 'Add a new verification challenge for extra rewards?',
      icon: '🎮',
      createdBy: 'TrustKeeper',
      createdAt: Date.now() - 21600000,
      expiresAt: Date.now() + 345600000,
      votesFor: 156,
      votesAgainst: 12,
      status: 'active',
      reward: '+30 XP for voting!',
    },
  ],
  explorers: [
    {
      id: 'prop_explorers_1',
      title: '🗺️ New Quest Zone',
      description: 'Should we unlock the Crystal Caves quest zone?',
      icon: '💎',
      createdBy: 'PathFinder',
      createdAt: Date.now() - 64800000,
      expiresAt: Date.now() + 432000000,
      votesFor: 203,
      votesAgainst: 34,
      status: 'active',
      reward: '+40 XP for voting!',
    },
  ],
};

// Initial mock faction stats
const initialFactionStats: Record<FactionId, FactionStats> = {
  miners: { 
    totalXP: 125000, 
    totalMembers: 342, 
    weeklyXP: 15200, 
    rank: 2,
    treasury: 8500,
    activeProposals: 1,
    totalVotes: 150,
  },
  builders: { 
    totalXP: 148000, 
    totalMembers: 389, 
    weeklyXP: 18500, 
    rank: 1,
    treasury: 12300,
    activeProposals: 1,
    totalVotes: 134,
  },
  validators: { 
    totalXP: 98000, 
    totalMembers: 267, 
    weeklyXP: 12100, 
    rank: 3,
    treasury: 6200,
    activeProposals: 1,
    totalVotes: 168,
  },
  explorers: { 
    totalXP: 87000, 
    totalMembers: 234, 
    weeklyXP: 9800, 
    rank: 4,
    treasury: 5400,
    activeProposals: 1,
    totalVotes: 237,
  },
};

// Calculate member rank based on contribution
const calculateMemberRank = (xp: number, votes: number): string => {
  const score = xp + (votes * 50);
  if (score >= 5000) return 'Legend';
  if (score >= 2500) return 'Champion';
  if (score >= 1000) return 'Elder';
  if (score >= 250) return 'Member';
  return 'Rookie';
};

export const useFactionStore = create<FactionState>()(
  persist(
    (set, get) => ({
      playerFaction: null,
      joinedAt: null,
      xpContributed: 0,
      votesParticipated: 0,
      memberRank: 'Rookie',
      factionStats: initialFactionStats,
      proposals: sampleProposals,
      playerVotes: {},
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      joinFaction: (factionId, playerId, username) => {
        set({
          playerFaction: factionId,
          joinedAt: Date.now(),
          xpContributed: 0,
          votesParticipated: 0,
          memberRank: 'Rookie',
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
        const { playerFaction, xpContributed, factionStats, votesParticipated } = get();
        if (!playerFaction) return;
        
        const newXP = xpContributed + amount;
        const newRank = calculateMemberRank(newXP, votesParticipated);
        
        set({
          xpContributed: newXP,
          memberRank: newRank,
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
          votesParticipated: 0,
          memberRank: 'Rookie',
          playerVotes: {},
        });
      },
      
      // DAO Voting system!
      voteOnProposal: (proposalId, vote) => {
        const { playerFaction, proposals, playerVotes, votesParticipated, xpContributed } = get();
        if (!playerFaction) return;
        
        // Already voted?
        if (playerVotes[proposalId]) return;
        
        // Record vote
        const newVotes = { ...playerVotes, [proposalId]: vote };
        const newVotesCount = votesParticipated + 1;
        const newRank = calculateMemberRank(xpContributed, newVotesCount);
        
        // Update proposal
        const factionProposals = [...proposals[playerFaction]];
        const proposalIndex = factionProposals.findIndex(p => p.id === proposalId);
        if (proposalIndex >= 0) {
          const proposal = { ...factionProposals[proposalIndex] };
          if (vote === 'for') {
            proposal.votesFor += 1;
          } else {
            proposal.votesAgainst += 1;
          }
          factionProposals[proposalIndex] = proposal;
        }
        
        set({
          playerVotes: newVotes,
          votesParticipated: newVotesCount,
          memberRank: newRank,
          proposals: {
            ...proposals,
            [playerFaction]: factionProposals,
          },
        });
      },
      
      // Treasury donation (teaches pooling resources!)
      donateToTreasury: (amount) => {
        const { playerFaction, factionStats, xpContributed } = get();
        if (!playerFaction || xpContributed < amount) return;
        
        set({
          xpContributed: xpContributed - amount,
          factionStats: {
            ...factionStats,
            [playerFaction]: {
              ...factionStats[playerFaction],
              treasury: factionStats[playerFaction].treasury + amount,
            },
          },
        });
      },
      
      getMemberRank: () => {
        const { xpContributed, votesParticipated } = get();
        return calculateMemberRank(xpContributed, votesParticipated);
      },
    }),
    {
      name: 'blockquest-faction-storage',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      partialize: (state) => ({
        playerFaction: state.playerFaction,
        joinedAt: state.joinedAt,
        xpContributed: state.xpContributed,
        votesParticipated: state.votesParticipated,
        memberRank: state.memberRank,
        playerVotes: state.playerVotes,
      }),
      onRehydrateStorage: () => () => {
        useFactionStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export default useFactionStore;
