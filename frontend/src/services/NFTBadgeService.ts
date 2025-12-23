// BlockQuest Official - NFT Badge Service
// Handles badge NFT creation, tracking, and rewards
import { NFTBadgeMetadata, BadgeReward, APERTUM_CONFIG } from './ApertumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Badge definitions with unlock criteria and rewards
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  gameId: string; // 'arcade' for general badges
  unlockCriteria: {
    type: 'highscore' | 'level' | 'plays' | 'achievement';
    threshold: number;
    gameId?: string; // specific game for highscore badges
  };
  rewards: BadgeReward;
  image: string;
}

// All available badges in the game
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Level-Up Badges
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5 in BlockQuest',
    rarity: 'Common',
    gameId: 'arcade',
    unlockCriteria: { type: 'level', threshold: 5 },
    rewards: { booster: '1.5x XP for 1 game' },
    image: '⭐',
  },
  {
    id: 'level_10',
    name: 'Chain Champion',
    description: 'Reach Level 10 in BlockQuest',
    rarity: 'Rare',
    gameId: 'arcade',
    unlockCriteria: { type: 'level', threshold: 10 },
    rewards: { booster: '2x XP for 1 game', skinId: 'neon_glow' },
    image: '🏆',
  },
  {
    id: 'level_25',
    name: 'Block Legend',
    description: 'Reach Level 25 in BlockQuest',
    rarity: 'Epic',
    gameId: 'arcade',
    unlockCriteria: { type: 'level', threshold: 25 },
    rewards: { booster: '2x XP for 3 games', timeBonus: 30, skinId: 'cyber_punk' },
    image: '👑',
  },
  {
    id: 'level_50',
    name: 'Blockchain Master',
    description: 'Reach Level 50 in BlockQuest',
    rarity: 'Legendary',
    gameId: 'arcade',
    unlockCriteria: { type: 'level', threshold: 50 },
    rewards: { 
      booster: '3x XP for 5 games', 
      timeBonus: 60, 
      skinId: 'golden_chain',
      collectibleId: 'genesis_block'
    },
    image: '💎',
  },
  {
    id: 'level_100',
    name: 'Genesis Guardian',
    description: 'Reach Level 100 - True BlockQuest Master',
    rarity: 'Legendary',
    gameId: 'arcade',
    unlockCriteria: { type: 'level', threshold: 100 },
    rewards: { 
      booster: '5x XP permanent', 
      timeBonus: 120, 
      skinId: 'genesis_armor',
      collectibleId: 'genesis_key'
    },
    image: '🔱',
  },

  // High Score Badges - Block Muncher
  {
    id: 'block_muncher_500',
    name: 'Block Collector',
    description: 'Score 500+ in Block Muncher',
    rarity: 'Common',
    gameId: 'block-muncher',
    unlockCriteria: { type: 'highscore', threshold: 500, gameId: 'block-muncher' },
    rewards: { booster: 'Extra Block x3' },
    image: '🟡',
  },
  {
    id: 'block_muncher_1000',
    name: 'Block Devourer',
    description: 'Score 1000+ in Block Muncher',
    rarity: 'Rare',
    gameId: 'block-muncher',
    unlockCriteria: { type: 'highscore', threshold: 1000, gameId: 'block-muncher' },
    rewards: { booster: 'Speed Boost', timeBonus: 15 },
    image: '🔶',
  },
  {
    id: 'block_muncher_2000',
    name: 'Chain Muncher',
    description: 'Score 2000+ in Block Muncher',
    rarity: 'Epic',
    gameId: 'block-muncher',
    unlockCriteria: { type: 'highscore', threshold: 2000, gameId: 'block-muncher' },
    rewards: { booster: 'Ghost Shield', timeBonus: 30, skinId: 'pac_gold' },
    image: '💛',
  },

  // High Score Badges - Chain Invaders
  {
    id: 'chain_invaders_1000',
    name: 'Alien Hunter',
    description: 'Score 1000+ in Chain Invaders',
    rarity: 'Common',
    gameId: 'chain-invaders',
    unlockCriteria: { type: 'highscore', threshold: 1000, gameId: 'chain-invaders' },
    rewards: { booster: 'Rapid Fire' },
    image: '👾',
  },
  {
    id: 'chain_invaders_2500',
    name: 'Space Defender',
    description: 'Score 2500+ in Chain Invaders',
    rarity: 'Rare',
    gameId: 'chain-invaders',
    unlockCriteria: { type: 'highscore', threshold: 2500, gameId: 'chain-invaders' },
    rewards: { booster: 'Triple Shot', timeBonus: 20 },
    image: '🛸',
  },
  {
    id: 'chain_invaders_5000',
    name: 'Consensus Protector',
    description: 'Score 5000+ in Chain Invaders',
    rarity: 'Epic',
    gameId: 'chain-invaders',
    unlockCriteria: { type: 'highscore', threshold: 5000, gameId: 'chain-invaders' },
    rewards: { booster: 'Laser Beam', timeBonus: 45, skinId: 'cosmic_ship' },
    image: '🌟',
  },

  // High Score Badges - Token Tumble
  {
    id: 'token_tumble_500',
    name: 'Token Stacker',
    description: 'Score 500+ in Token Tumble',
    rarity: 'Common',
    gameId: 'token-tumble',
    unlockCriteria: { type: 'highscore', threshold: 500, gameId: 'token-tumble' },
    rewards: { booster: 'Slow Fall' },
    image: '🧱',
  },
  {
    id: 'token_tumble_1500',
    name: 'Line Clearer',
    description: 'Score 1500+ in Token Tumble',
    rarity: 'Rare',
    gameId: 'token-tumble',
    unlockCriteria: { type: 'highscore', threshold: 1500, gameId: 'token-tumble' },
    rewards: { booster: 'Hold Piece', timeBonus: 20 },
    image: '📦',
  },
  {
    id: 'token_tumble_3000',
    name: 'Tetris Titan',
    description: 'Score 3000+ in Token Tumble',
    rarity: 'Epic',
    gameId: 'token-tumble',
    unlockCriteria: { type: 'highscore', threshold: 3000, gameId: 'token-tumble' },
    rewards: { booster: 'Ghost Preview', timeBonus: 40, skinId: 'crystal_blocks' },
    image: '💠',
  },

  // High Score Badges - Crypto Climber
  {
    id: 'crypto_climber_300',
    name: 'Ladder Learner',
    description: 'Score 300+ in Crypto Climber',
    rarity: 'Common',
    gameId: 'crypto-climber',
    unlockCriteria: { type: 'highscore', threshold: 300, gameId: 'crypto-climber' },
    rewards: { booster: 'Double Jump' },
    image: '🪜',
  },
  {
    id: 'crypto_climber_800',
    name: 'NFT Collector',
    description: 'Score 800+ in Crypto Climber',
    rarity: 'Rare',
    gameId: 'crypto-climber',
    unlockCriteria: { type: 'highscore', threshold: 800, gameId: 'crypto-climber' },
    rewards: { booster: 'Magnet', timeBonus: 25 },
    image: '🥚',
  },
  {
    id: 'crypto_climber_1500',
    name: 'Barrel Dodger',
    description: 'Score 1500+ in Crypto Climber',
    rarity: 'Epic',
    gameId: 'crypto-climber',
    unlockCriteria: { type: 'highscore', threshold: 1500, gameId: 'crypto-climber' },
    rewards: { booster: 'Invincibility', timeBonus: 45, skinId: 'golden_climber' },
    image: '🏅',
  },

  // Play Count Badges
  {
    id: 'plays_5',
    name: 'Arcade Rookie',
    description: 'Play 5 games in BlockQuest',
    rarity: 'Common',
    gameId: 'arcade',
    unlockCriteria: { type: 'plays', threshold: 5 },
    rewards: { booster: 'Lucky Start' },
    image: '🎮',
  },
  {
    id: 'plays_25',
    name: 'Regular Player',
    description: 'Play 25 games in BlockQuest',
    rarity: 'Rare',
    gameId: 'arcade',
    unlockCriteria: { type: 'plays', threshold: 25 },
    rewards: { booster: '1.5x Score', timeBonus: 10 },
    image: '🕹️',
  },
  {
    id: 'plays_100',
    name: 'Arcade Addict',
    description: 'Play 100 games in BlockQuest',
    rarity: 'Epic',
    gameId: 'arcade',
    unlockCriteria: { type: 'plays', threshold: 100 },
    rewards: { booster: '2x Score for 5 games', timeBonus: 30, skinId: 'retro_master' },
    image: '🎰',
  },
  {
    id: 'plays_500',
    name: 'BlockQuest Legend',
    description: 'Play 500 games in BlockQuest',
    rarity: 'Legendary',
    gameId: 'arcade',
    unlockCriteria: { type: 'plays', threshold: 500 },
    rewards: { 
      booster: '3x Score permanent', 
      timeBonus: 60, 
      skinId: 'legendary_arcade',
      collectibleId: 'arcade_crown'
    },
    image: '🏆',
  },
];

// Storage key for unlocked badges
const UNLOCKED_BADGES_KEY = '@blockquest_unlocked_badges';
const ACTIVE_REWARDS_KEY = '@blockquest_active_rewards';

// NFT Badge that has been unlocked
export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: number;
  isMinted: boolean; // Whether it's been minted to blockchain
  txHash?: string; // Transaction hash if minted
  tokenId?: string; // NFT token ID if minted
}

// Active reward from a badge
export interface ActiveReward {
  badgeId: string;
  type: 'booster' | 'timeBonus' | 'skin' | 'collectible';
  value: string | number;
  expiresAt?: number; // For limited-use boosters
  usesRemaining?: number;
}

class NFTBadgeService {
  private unlockedBadges: UnlockedBadge[] = [];
  private activeRewards: ActiveReward[] = [];

  constructor() {
    this.loadState();
  }

  // Load saved state
  private async loadState() {
    try {
      const badges = await AsyncStorage.getItem(UNLOCKED_BADGES_KEY);
      const rewards = await AsyncStorage.getItem(ACTIVE_REWARDS_KEY);
      
      if (badges) this.unlockedBadges = JSON.parse(badges);
      if (rewards) this.activeRewards = JSON.parse(rewards);
    } catch (error) {
      console.log('Failed to load badge state:', error);
    }
  }

  // Save state
  private async saveState() {
    try {
      await AsyncStorage.setItem(UNLOCKED_BADGES_KEY, JSON.stringify(this.unlockedBadges));
      await AsyncStorage.setItem(ACTIVE_REWARDS_KEY, JSON.stringify(this.activeRewards));
    } catch (error) {
      console.log('Failed to save badge state:', error);
    }
  }

  // Check if a badge is unlocked
  isBadgeUnlocked(badgeId: string): boolean {
    return this.unlockedBadges.some(b => b.badgeId === badgeId);
  }

  // Get all unlocked badges
  getUnlockedBadges(): UnlockedBadge[] {
    return [...this.unlockedBadges];
  }

  // Get all badge definitions
  getAllBadges(): BadgeDefinition[] {
    return BADGE_DEFINITIONS;
  }

  // Get badge definition by ID
  getBadgeById(badgeId: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find(b => b.id === badgeId);
  }

  // Check for newly unlocked badges based on player stats
  checkForNewBadges(stats: {
    level: number;
    gamesPlayed: number;
    highScores: Record<string, number>;
  }): BadgeDefinition[] {
    const newBadges: BadgeDefinition[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already unlocked
      if (this.isBadgeUnlocked(badge.id)) continue;

      const { type, threshold, gameId } = badge.unlockCriteria;
      let isUnlocked = false;

      switch (type) {
        case 'level':
          isUnlocked = stats.level >= threshold;
          break;
        case 'plays':
          isUnlocked = stats.gamesPlayed >= threshold;
          break;
        case 'highscore':
          if (gameId && stats.highScores[gameId]) {
            isUnlocked = stats.highScores[gameId] >= threshold;
          }
          break;
      }

      if (isUnlocked) {
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // Unlock a badge
  async unlockBadge(badgeId: string): Promise<UnlockedBadge | null> {
    if (this.isBadgeUnlocked(badgeId)) return null;

    const badge = this.getBadgeById(badgeId);
    if (!badge) return null;

    const unlockedBadge: UnlockedBadge = {
      badgeId,
      unlockedAt: Date.now(),
      isMinted: false,
    };

    this.unlockedBadges.push(unlockedBadge);

    // Activate rewards
    this.activateRewards(badge);

    await this.saveState();
    return unlockedBadge;
  }

  // Activate rewards from a badge
  private activateRewards(badge: BadgeDefinition) {
    const { rewards } = badge;

    if (rewards.booster) {
      // Check if it's limited use
      const usesMatch = rewards.booster.match(/(\d+) game/);
      const uses = usesMatch ? parseInt(usesMatch[1]) : undefined;
      
      this.activeRewards.push({
        badgeId: badge.id,
        type: 'booster',
        value: rewards.booster,
        usesRemaining: uses,
      });
    }

    if (rewards.timeBonus) {
      this.activeRewards.push({
        badgeId: badge.id,
        type: 'timeBonus',
        value: rewards.timeBonus,
      });
    }

    if (rewards.skinId) {
      this.activeRewards.push({
        badgeId: badge.id,
        type: 'skin',
        value: rewards.skinId,
      });
    }

    if (rewards.collectibleId) {
      this.activeRewards.push({
        badgeId: badge.id,
        type: 'collectible',
        value: rewards.collectibleId,
      });
    }
  }

  // Get active rewards
  getActiveRewards(): ActiveReward[] {
    return [...this.activeRewards];
  }

  // Get unlocked skins
  getUnlockedSkins(): string[] {
    return this.activeRewards
      .filter(r => r.type === 'skin')
      .map(r => r.value as string);
  }

  // Get total time bonus
  getTotalTimeBonus(): number {
    return this.activeRewards
      .filter(r => r.type === 'timeBonus')
      .reduce((sum, r) => sum + (r.value as number), 0);
  }

  // Use a booster (decrements uses if limited)
  useBooster(badgeId: string): boolean {
    const reward = this.activeRewards.find(
      r => r.badgeId === badgeId && r.type === 'booster'
    );

    if (!reward) return false;

    if (reward.usesRemaining !== undefined) {
      reward.usesRemaining--;
      if (reward.usesRemaining <= 0) {
        this.activeRewards = this.activeRewards.filter(
          r => !(r.badgeId === badgeId && r.type === 'booster')
        );
      }
      this.saveState();
    }

    return true;
  }

  // Generate NFT metadata for a badge
  generateNFTMetadata(badgeId: string, playerName: string): NFTBadgeMetadata | null {
    const badge = this.getBadgeById(badgeId);
    const unlocked = this.unlockedBadges.find(b => b.badgeId === badgeId);
    
    if (!badge || !unlocked) return null;

    return {
      name: badge.name,
      description: badge.description,
      image: badge.image, // Would be replaced with actual image URL
      attributes: [
        { trait_type: 'Rarity', value: badge.rarity },
        { trait_type: 'Game', value: badge.gameId },
        { trait_type: 'Player', value: playerName },
        { trait_type: 'Unlocked', value: new Date(unlocked.unlockedAt).toISOString() },
      ],
      rarity: badge.rarity,
      gameId: badge.gameId,
      unlockedAt: unlocked.unlockedAt,
    };
  }

  // Mark badge as minted (after blockchain tx)
  async markAsMinted(badgeId: string, txHash: string, tokenId: string): Promise<void> {
    const badge = this.unlockedBadges.find(b => b.badgeId === badgeId);
    if (badge) {
      badge.isMinted = true;
      badge.txHash = txHash;
      badge.tokenId = tokenId;
      await this.saveState();
    }
  }

  // Get unminted badges (for batch minting)
  getUnmintedBadges(): UnlockedBadge[] {
    return this.unlockedBadges.filter(b => !b.isMinted);
  }

  // Clear all data (for reset)
  async clearAll(): Promise<void> {
    this.unlockedBadges = [];
    this.activeRewards = [];
    await AsyncStorage.removeItem(UNLOCKED_BADGES_KEY);
    await AsyncStorage.removeItem(ACTIVE_REWARDS_KEY);
  }
}

export const nftBadgeService = new NFTBadgeService();
export default nftBadgeService;
