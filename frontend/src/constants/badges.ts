// BlockQuest Official - Badge Definitions
// 50+ collectible NFT-style badges with BQO airdrops

import { CRT_COLORS } from './crtTheme';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// BQO Airdrop amounts based on badge rarity
export const BQO_AIRDROP_AMOUNTS: Record<BadgeRarity, number> = {
  common: 1,      // Common badges = 1 BQO
  uncommon: 3,    // Uncommon badges = 3 BQO
  rare: 10,       // Rare badges = 10 BQO
  epic: 25,       // Epic badges = 25 BQO
  legendary: 100, // Legendary badges = 100 BQO
};

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: string;
  requirement: string;
  xpReward: number;
  bqoAirdrop: number; // BQO tokens airdropped when badge unlocked
}

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: CRT_COLORS.rarityCommon,
  uncommon: CRT_COLORS.rarityUncommon,
  rare: CRT_COLORS.rarityRare,
  epic: CRT_COLORS.rarityEpic,
  legendary: CRT_COLORS.rarityLegendary,
};

export const ALL_BADGES: BadgeDefinition[] = [
  // Tutorial Badges
  { id: 'first_block', name: 'First Block', description: 'Stack your first block!', icon: '🧱', rarity: 'common', category: 'tutorial', requirement: 'Stack 1 block', xpReward: 10, bqoAirdrop: 1 },
  { id: 'block_stacker_1', name: 'Block Stacker I', description: 'Complete the tutorial', icon: '📚', rarity: 'common', category: 'tutorial', requirement: 'Stack 5 blocks', xpReward: 25, bqoAirdrop: 1 },
  { id: 'quick_learner', name: 'Quick Learner', description: 'Beat tutorial in under 20s', icon: '⚡', rarity: 'uncommon', category: 'tutorial', requirement: 'Tutorial < 20s', xpReward: 50, bqoAirdrop: 3 },
  
  // Block Games
  { id: 'chain_starter', name: 'Chain Starter', description: 'Build your first chain', icon: '🔗', rarity: 'common', category: 'chain', requirement: 'Chain 3 blocks', xpReward: 15, bqoAirdrop: 1 },
  { id: 'chain_master', name: 'Chain Master', description: 'Build a 10-block chain', icon: '⛓️', rarity: 'rare', category: 'chain', requirement: 'Chain 10 blocks', xpReward: 75, bqoAirdrop: 10 },
  { id: 'chain_legend', name: 'Chain Legend', description: 'Build a 20-block chain', icon: '🔗💎', rarity: 'epic', category: 'chain', requirement: 'Chain 20 blocks', xpReward: 150, bqoAirdrop: 25 },
  
  // Hash Games
  { id: 'hash_finder', name: 'Hash Finder', description: 'Match your first hash', icon: '#️⃣', rarity: 'common', category: 'hash', requirement: 'Match 1 hash', xpReward: 10, bqoAirdrop: 1 },
  { id: 'hash_hunter', name: 'Hash Hunter', description: 'Match 25 hashes total', icon: '🔍', rarity: 'uncommon', category: 'hash', requirement: 'Match 25 hashes', xpReward: 40, bqoAirdrop: 3 },
  { id: 'hash_wizard', name: 'Hash Wizard', description: 'Match 100 hashes total', icon: '🧙', rarity: 'rare', category: 'hash', requirement: 'Match 100 hashes', xpReward: 100, bqoAirdrop: 10 },
  
  // Mining Games
  { id: 'miner_rookie', name: 'Miner Rookie', description: 'Mine your first block', icon: '⛏️', rarity: 'common', category: 'mining', requirement: 'Mine 1 block', xpReward: 10, bqoAirdrop: 1 },
  { id: 'miner_pro', name: 'Miner Pro', description: 'Mine 50 blocks total', icon: '💎', rarity: 'uncommon', category: 'mining', requirement: 'Mine 50 blocks', xpReward: 50, bqoAirdrop: 3 },
  { id: 'miner_legend', name: 'Miner Legend', description: 'Mine 200 blocks total', icon: '🏆', rarity: 'epic', category: 'mining', requirement: 'Mine 200 blocks', xpReward: 200, bqoAirdrop: 25 },
  
  // Speed Badges
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete any game in record time', icon: '🏃', rarity: 'rare', category: 'speed', requirement: 'Beat record time', xpReward: 75, bqoAirdrop: 10 },
  { id: 'lightning_fast', name: 'Lightning Fast', description: 'Beat Lightning Dash', icon: '⚡', rarity: 'uncommon', category: 'speed', requirement: 'Win Lightning Dash', xpReward: 40, bqoAirdrop: 3 },
  { id: 'time_lord', name: 'Time Lord', description: 'Beat 5 speed records', icon: '⏱️', rarity: 'epic', category: 'speed', requirement: '5 speed records', xpReward: 150, bqoAirdrop: 25 },
  
  // Puzzle Badges
  { id: 'puzzle_solver', name: 'Puzzle Solver', description: 'Solve your first puzzle', icon: '🧩', rarity: 'common', category: 'puzzle', requirement: 'Solve 1 puzzle', xpReward: 10, bqoAirdrop: 1 },
  { id: 'brain_teaser', name: 'Brain Teaser', description: 'Solve 20 puzzles', icon: '🧠', rarity: 'uncommon', category: 'puzzle', requirement: 'Solve 20 puzzles', xpReward: 45, bqoAirdrop: 3 },
  { id: 'genius', name: 'Genius', description: 'Solve 100 puzzles', icon: '🎓', rarity: 'rare', category: 'puzzle', requirement: 'Solve 100 puzzles', xpReward: 100, bqoAirdrop: 10 },
  
  // Collection Badges
  { id: 'collector_starter', name: 'Collector', description: 'Earn 5 badges', icon: '📦', rarity: 'common', category: 'collection', requirement: 'Earn 5 badges', xpReward: 20, bqoAirdrop: 1 },
  { id: 'badge_hunter', name: 'Badge Hunter', description: 'Earn 15 badges', icon: '🎯', rarity: 'uncommon', category: 'collection', requirement: 'Earn 15 badges', xpReward: 60, bqoAirdrop: 3 },
  { id: 'badge_collector', name: 'Badge Collector', description: 'Earn 30 badges', icon: '🏅', rarity: 'rare', category: 'collection', requirement: 'Earn 30 badges', xpReward: 120, bqoAirdrop: 10 },
  { id: 'badge_master', name: 'Badge Master', description: 'Earn 50 badges', icon: '👑', rarity: 'legendary', category: 'collection', requirement: 'Earn 50 badges', xpReward: 300, bqoAirdrop: 100 },
  
  // Daily Badges
  { id: 'daily_player', name: 'Daily Player', description: 'Play for 3 days in a row', icon: '📅', rarity: 'common', category: 'daily', requirement: '3-day streak', xpReward: 25, bqoAirdrop: 1 },
  { id: 'weekly_warrior', name: 'Weekly Warrior', description: 'Play for 7 days in a row', icon: '🗓️', rarity: 'uncommon', category: 'daily', requirement: '7-day streak', xpReward: 75, bqoAirdrop: 3 },
  { id: 'monthly_master', name: 'Monthly Master', description: 'Play for 30 days', icon: '📆', rarity: 'epic', category: 'daily', requirement: '30-day streak', xpReward: 250, bqoAirdrop: 25 },
  
  // Game-Specific Badges
  { id: 'block_muncher', name: 'Block Muncher', description: 'Win Block Muncher', icon: '👻', rarity: 'uncommon', category: 'games', requirement: 'Beat Block Muncher', xpReward: 35, bqoAirdrop: 3 },
  { id: 'chain_invader', name: 'Chain Invader', description: 'Win Chain Invaders', icon: '👾', rarity: 'uncommon', category: 'games', requirement: 'Beat Chain Invaders', xpReward: 35, bqoAirdrop: 3 },
  { id: 'hash_hopper', name: 'Hash Hopper', description: 'Win Hash Hopper', icon: '🐸', rarity: 'uncommon', category: 'games', requirement: 'Beat Hash Hopper', xpReward: 35, bqoAirdrop: 3 },
  { id: 'seed_sprinter', name: 'Seed Sprinter', description: 'Win Seed Sprint', icon: '🌱', rarity: 'uncommon', category: 'games', requirement: 'Beat Seed Sprint', xpReward: 35, bqoAirdrop: 3 },
  { id: 'crypto_climber', name: 'Crypto Climber', description: 'Win Crypto Climber', icon: '🧗', rarity: 'uncommon', category: 'games', requirement: 'Beat Crypto Climber', xpReward: 35, bqoAirdrop: 3 },
  { id: 'stake_smasher', name: 'Stake Smasher', description: 'Win Stake Smash', icon: '🛡️', rarity: 'uncommon', category: 'games', requirement: 'Beat Stake Smash', xpReward: 35, bqoAirdrop: 3 },
  { id: 'ledger_leaper', name: 'Ledger Leaper', description: 'Win Ledger Leap', icon: '📒', rarity: 'uncommon', category: 'games', requirement: 'Beat Ledger Leap', xpReward: 35, bqoAirdrop: 3 },
  { id: 'dao_champion', name: 'DAO Champion', description: 'Win DAO Duel', icon: '🏛️', rarity: 'uncommon', category: 'games', requirement: 'Beat DAO Duel', xpReward: 35, bqoAirdrop: 3 },
  { id: 'mine_master', name: 'Mine Master', description: 'Win Mine Blaster', icon: '💥', rarity: 'uncommon', category: 'games', requirement: 'Beat Mine Blaster', xpReward: 35, bqoAirdrop: 3 },
  { id: 'lightning_legend', name: 'Lightning Legend', description: 'Win Lightning Dash', icon: '⚡', rarity: 'uncommon', category: 'games', requirement: 'Beat Lightning Dash', xpReward: 35, bqoAirdrop: 3 },
  { id: 'bridge_builder', name: 'Bridge Builder', description: 'Win Bridge Bouncer', icon: '🌉', rarity: 'uncommon', category: 'games', requirement: 'Beat Bridge Bouncer', xpReward: 35, bqoAirdrop: 3 },
  { id: 'ipfs_pinner', name: 'IPFS Pinner', description: 'Win IPFS Pinball', icon: '📌', rarity: 'uncommon', category: 'games', requirement: 'Beat IPFS Pinball', xpReward: 35, bqoAirdrop: 3 },
  { id: 'contract_crusher', name: 'Contract Crusher', description: 'Win Contract Crusher', icon: '📜', rarity: 'uncommon', category: 'games', requirement: 'Beat Contract Crusher', xpReward: 35, bqoAirdrop: 3 },
  { id: 'quest_completer', name: 'Quest Completer', description: 'Win Quest Vault', icon: '🏰', rarity: 'uncommon', category: 'games', requirement: 'Beat Quest Vault', xpReward: 35, bqoAirdrop: 3 },
  
  // Mastery Badges
  { id: 'perfectionist', name: 'Perfectionist', description: 'Get a perfect score', icon: '💯', rarity: 'rare', category: 'mastery', requirement: 'Perfect game', xpReward: 100, bqoAirdrop: 10 },
  { id: 'no_mistakes', name: 'No Mistakes', description: 'Win without losing a life', icon: '❤️', rarity: 'rare', category: 'mastery', requirement: 'Flawless win', xpReward: 100, bqoAirdrop: 10 },
  { id: 'combo_king', name: 'Combo King', description: 'Get a 15+ combo', icon: '🔥', rarity: 'epic', category: 'mastery', requirement: '15+ combo', xpReward: 150, bqoAirdrop: 25 },
  
  // Special Badges
  { id: 'early_bird', name: 'Early Bird', description: 'Play before 8am', icon: '🌅', rarity: 'rare', category: 'special', requirement: 'Play early morning', xpReward: 50, bqoAirdrop: 10 },
  { id: 'night_owl', name: 'Night Owl', description: 'Play after 10pm', icon: '🦉', rarity: 'rare', category: 'special', requirement: 'Play late night', xpReward: 50, bqoAirdrop: 10 },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Play on weekends', icon: '🎉', rarity: 'common', category: 'special', requirement: 'Play on weekend', xpReward: 20, bqoAirdrop: 1 },
  
  // Legendary Badges
  { id: 'all_games', name: 'Game Master', description: 'Beat all 15 games', icon: '🎮', rarity: 'legendary', category: 'legendary', requirement: 'Win all games', xpReward: 500, bqoAirdrop: 100 },
  { id: 'all_badges', name: 'Ultimate Collector', description: 'Collect all badges', icon: '🌟', rarity: 'legendary', category: 'legendary', requirement: 'All badges', xpReward: 1000, bqoAirdrop: 100 },
  { id: 'blockchain_legend', name: 'Blockchain Legend', description: 'Reach Diamond rank', icon: '💎', rarity: 'legendary', category: 'legendary', requirement: 'Diamond rank', xpReward: 500, bqoAirdrop: 100 },
];

// Get badge by ID
export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return ALL_BADGES.find(b => b.id === id);
};

// Get badges by category
export const getBadgesByCategory = (category: string): BadgeDefinition[] => {
  return ALL_BADGES.filter(b => b.category === category);
};

// Get badges by rarity
export const getBadgesByRarity = (rarity: BadgeRarity): BadgeDefinition[] => {
  return ALL_BADGES.filter(b => b.rarity === rarity);
};

export default { ALL_BADGES, RARITY_COLORS, getBadgeById, getBadgesByCategory, getBadgesByRarity };
