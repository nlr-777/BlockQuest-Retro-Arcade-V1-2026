// BlockQuest Official - Achievement Badge Categories
// Based on Web3 Chaos Chronicles design doc

export type BadgeCategory = 'token' | 'nft' | 'web3' | 'meta' | 'game' | 'story';

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  icon: string;
  requirement: string;
  xpReward: number;
  knowledgeTokenReward: number;
}

// TOKEN ACHIEVEMENTS (Book 3 - The Arcade)
export const TOKEN_BADGES: AchievementBadge[] = [
  {
    id: 'first-token',
    name: 'First Token',
    description: 'Collected your first Quest Coin in the arcade!',
    category: 'token',
    rarity: 'Common',
    icon: '🪙',
    requirement: 'Earn your first Quest Coin',
    xpReward: 50,
    knowledgeTokenReward: 5,
  },
  {
    id: 'token-collector',
    name: 'Token Collector',
    description: 'Collected 100 Quest Coins total',
    category: 'token',
    rarity: 'Rare',
    icon: '💰',
    requirement: 'Collect 100 Quest Coins',
    xpReward: 100,
    knowledgeTokenReward: 10,
  },
  {
    id: 'smart-contract-scholar',
    name: 'Smart Contract Scholar',
    description: 'Learned how smart contracts work by playing Contract Crusher',
    category: 'token',
    rarity: 'Rare',
    icon: '📜',
    requirement: 'Score 1000+ in Contract Crusher',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'tokenomics-master',
    name: 'Tokenomics Master',
    description: 'Mastered the economics of tokens in Token Tumble',
    category: 'token',
    rarity: 'Epic',
    icon: '📊',
    requirement: 'Score 2000+ in Token Tumble',
    xpReward: 200,
    knowledgeTokenReward: 20,
  },
];

// NFT ACHIEVEMENTS (Book 4 - The Gallery)
export const NFT_BADGES: AchievementBadge[] = [
  {
    id: 'first-badge',
    name: 'First Badge Minted',
    description: 'Earned your first NFT badge!',
    category: 'nft',
    rarity: 'Common',
    icon: '🎖️',
    requirement: 'Earn any badge',
    xpReward: 50,
    knowledgeTokenReward: 5,
  },
  {
    id: 'badge-collector',
    name: 'Badge Collector',
    description: 'Collected 5 unique badges',
    category: 'nft',
    rarity: 'Rare',
    icon: '🏅',
    requirement: 'Earn 5 different badges',
    xpReward: 100,
    knowledgeTokenReward: 10,
  },
  {
    id: 'digital-artist',
    name: 'Digital Artist',
    description: 'Created beautiful chaos in Block Muncher',
    category: 'nft',
    rarity: 'Rare',
    icon: '🎨',
    requirement: 'Score 1500+ in Block Muncher',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'gallery-curator',
    name: 'Gallery Curator',
    description: 'Collected 10 unique badges in your Vault',
    category: 'nft',
    rarity: 'Epic',
    icon: '🖼️',
    requirement: 'Earn 10 different badges',
    xpReward: 200,
    knowledgeTokenReward: 20,
  },
  {
    id: 'legendary-collector',
    name: 'Legendary Collector',
    description: 'Obtained a Legendary rarity badge',
    category: 'nft',
    rarity: 'Legendary',
    icon: '👑',
    requirement: 'Earn a Legendary badge',
    xpReward: 500,
    knowledgeTokenReward: 50,
  },
];

// WEB3 ACHIEVEMENTS (Book 5 - The Game Realm)
export const WEB3_BADGES: AchievementBadge[] = [
  {
    id: 'chain-explorer',
    name: 'Chain Explorer',
    description: 'Explored the blockchain in Chain Invaders',
    category: 'web3',
    rarity: 'Common',
    icon: '🔗',
    requirement: 'Play Chain Invaders',
    xpReward: 50,
    knowledgeTokenReward: 5,
  },
  {
    id: 'hash-master',
    name: 'Hash Master',
    description: 'Mastered cryptographic hashing in Hash Hopper',
    category: 'web3',
    rarity: 'Rare',
    icon: '#️⃣',
    requirement: 'Score 1000+ in Hash Hopper',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Learned about Layer 2 in Lightning Dash',
    category: 'web3',
    rarity: 'Rare',
    icon: '⚡',
    requirement: 'Score 1000+ in Lightning Dash',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'decentralization-hero',
    name: 'Decentralization Hero',
    description: 'Won your first DAO vote',
    category: 'web3',
    rarity: 'Epic',
    icon: '🏛️',
    requirement: 'Cast a vote in the DAO',
    xpReward: 200,
    knowledgeTokenReward: 20,
  },
  {
    id: 'ipfs-pioneer',
    name: 'IPFS Pioneer',
    description: 'Learned about decentralized storage in IPFS Pinball',
    category: 'web3',
    rarity: 'Rare',
    icon: '📦',
    requirement: 'Score 1500+ in IPFS Pinball',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
];

// META ACHIEVEMENTS (Cross-game achievements)
export const META_BADGES: AchievementBadge[] = [
  {
    id: 'arcade-explorer',
    name: 'Arcade Explorer',
    description: 'Tried all 15 games in the arcade!',
    category: 'meta',
    rarity: 'Epic',
    icon: '🎮',
    requirement: 'Play all 15 games at least once',
    xpReward: 300,
    knowledgeTokenReward: 30,
  },
  {
    id: 'high-scorer',
    name: 'High Scorer',
    description: 'Set a high score in 5 different games',
    category: 'meta',
    rarity: 'Rare',
    icon: '🏆',
    requirement: 'Get high scores in 5 games',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Completed all 5 Story Badge quizzes',
    category: 'meta',
    rarity: 'Legendary',
    icon: '📚',
    requirement: 'Unlock all 5 Story Badges',
    xpReward: 500,
    knowledgeTokenReward: 50,
  },
  {
    id: 'daily-player',
    name: 'Daily Player',
    description: 'Logged in 7 days in a row',
    category: 'meta',
    rarity: 'Rare',
    icon: '📅',
    requirement: 'Log in for 7 consecutive days',
    xpReward: 150,
    knowledgeTokenReward: 15,
  },
  {
    id: 'level-up-master',
    name: 'Level Up Master',
    description: 'Reached Level 10',
    category: 'meta',
    rarity: 'Epic',
    icon: '⬆️',
    requirement: 'Reach player level 10',
    xpReward: 250,
    knowledgeTokenReward: 25,
  },
  {
    id: 'chaos-champion',
    name: 'Chaos Champion',
    description: 'Achieved mastery of the Web3 Chaos Chronicles',
    category: 'meta',
    rarity: 'Legendary',
    icon: '🌟',
    requirement: 'Unlock 20 total badges',
    xpReward: 1000,
    knowledgeTokenReward: 100,
  },
];

// All achievement badges combined
export const ALL_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  ...TOKEN_BADGES,
  ...NFT_BADGES,
  ...WEB3_BADGES,
  ...META_BADGES,
];

// Badge category colors
export const BADGE_CATEGORY_COLORS: Record<BadgeCategory, string> = {
  token: '#FFD700',   // Gold
  nft: '#FF69B4',     // Pink
  web3: '#00CED1',    // Cyan
  meta: '#9370DB',    // Purple
  game: '#32CD32',    // Green
  story: '#FF8C00',   // Orange
};

// Get badge by ID
export const getBadgeById = (id: string): AchievementBadge | undefined => {
  return ALL_ACHIEVEMENT_BADGES.find(badge => badge.id === id);
};

// Get badges by category
export const getBadgesByCategory = (category: BadgeCategory): AchievementBadge[] => {
  return ALL_ACHIEVEMENT_BADGES.filter(badge => badge.category === category);
};
