// BlockQuest Official - Rank System
// Kid-friendly progression with fun titles

import { CRT_COLORS } from './crtTheme';

export interface RankTier {
  id: string;
  name: string;
  title: string;
  description: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: string;
  badge: string;
  perks: string[];
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'newbie',
    name: 'Newbie',
    title: 'Block Beginner',
    description: 'Just starting your block-building journey!',
    minXP: 0,
    maxXP: 99,
    color: '#808080',
    icon: '🌱',
    badge: '🥉',
    perks: ['Access to all games', 'Earn badges'],
  },
  {
    id: 'bronze',
    name: 'Bronze',
    title: 'Chain Starter',
    description: 'You\'re building momentum!',
    minXP: 100,
    maxXP: 299,
    color: '#CD7F32',
    icon: '⛓️',
    badge: '🥉',
    perks: ['Bronze badge border', 'Unlock daily quests'],
  },
  {
    id: 'silver',
    name: 'Silver',
    title: 'Hash Hero',
    description: 'Your skills are shining bright!',
    minXP: 300,
    maxXP: 599,
    color: '#C0C0C0',
    icon: '#️⃣',
    badge: '🥈',
    perks: ['Silver badge border', 'Extra daily quest'],
  },
  {
    id: 'gold',
    name: 'Gold',
    title: 'Block Builder',
    description: 'A true master of the blocks!',
    minXP: 600,
    maxXP: 999,
    color: '#FFD700',
    icon: '🏗️',
    badge: '🥇',
    perks: ['Gold badge border', 'Exclusive gold badges'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    title: 'Chain Champion',
    description: 'Elite block stacker!',
    minXP: 1000,
    maxXP: 1999,
    color: '#E5E4E2',
    icon: '👑',
    badge: '💎',
    perks: ['Platinum effects', 'Champion title'],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    title: 'Blockchain Legend',
    description: 'The ultimate block master!',
    minXP: 2000,
    maxXP: Infinity,
    color: '#B9F2FF',
    icon: '💎',
    badge: '🌟',
    perks: ['Rainbow effects', 'Legend status', 'All badges unlocked'],
  },
];

// Get rank by XP
export const getRankByXP = (xp: number): RankTier => {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (xp >= RANK_TIERS[i].minXP) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
};

// Get progress to next rank (0-100%)
export const getRankProgress = (xp: number): number => {
  const rank = getRankByXP(xp);
  if (rank.maxXP === Infinity) return 100;
  
  const rangeXP = rank.maxXP - rank.minXP;
  const progressXP = xp - rank.minXP;
  return Math.min(100, Math.round((progressXP / rangeXP) * 100));
};

// Get next rank
export const getNextRank = (xp: number): RankTier | null => {
  const currentRank = getRankByXP(xp);
  const currentIndex = RANK_TIERS.findIndex(r => r.id === currentRank.id);
  
  if (currentIndex < RANK_TIERS.length - 1) {
    return RANK_TIERS[currentIndex + 1];
  }
  return null;
};

export default { RANK_TIERS, getRankByXP, getRankProgress, getNextRank };
