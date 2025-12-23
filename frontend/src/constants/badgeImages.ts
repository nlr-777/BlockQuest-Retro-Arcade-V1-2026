// BlockQuest Official - NFT Badge Images
// AI-generated pixel art badges for the game

// Badge image mapping
export const BADGE_IMAGES: Record<string, any> = {
  // Level Badges
  'level_5': require('../../assets/badges/level_5.png'),
  'level_10': require('../../assets/badges/level_10.png'),
  'level_25': require('../../assets/badges/level_25.png'),
  'level_50': require('../../assets/badges/level_50.png'),
  'level_100': require('../../assets/badges/level_100.png'),
  
  // Game Badges
  'block_muncher_500': require('../../assets/badges/block_muncher.png'),
  'block_muncher_1000': require('../../assets/badges/block_muncher.png'),
  'block_muncher_2000': require('../../assets/badges/block_muncher.png'),
  'chain_invaders_1000': require('../../assets/badges/chain_invaders.png'),
  'chain_invaders_2500': require('../../assets/badges/chain_invaders.png'),
  'chain_invaders_5000': require('../../assets/badges/chain_invaders.png'),
  'token_tumble_500': require('../../assets/badges/token_tumble.png'),
  'token_tumble_1500': require('../../assets/badges/token_tumble.png'),
  'token_tumble_3000': require('../../assets/badges/token_tumble.png'),
  'crypto_climber_300': require('../../assets/badges/crypto_climber.png'),
  'crypto_climber_800': require('../../assets/badges/crypto_climber.png'),
  'crypto_climber_1500': require('../../assets/badges/crypto_climber.png'),
  
  // Play Count Badges
  'plays_5': require('../../assets/badges/plays_5.png'),
  'plays_25': require('../../assets/badges/plays_5.png'),
  'plays_100': require('../../assets/badges/plays_100.png'),
  'plays_500': require('../../assets/badges/plays_100.png'),
  
  // Special Badges
  'bqo_holder': require('../../assets/badges/bqo_holder.png'),
  'nft_collector': require('../../assets/badges/nft_collector.png'),
  'network_guardian': require('../../assets/badges/network_guardian.png'),
  'hash_hopper': require('../../assets/badges/hash_hopper.png'),
  'seed_sprint': require('../../assets/badges/seed_sprint.png'),
};

// Get badge image by ID (with fallback)
export const getBadgeImage = (badgeId: string): any => {
  // Direct match
  if (BADGE_IMAGES[badgeId]) {
    return BADGE_IMAGES[badgeId];
  }
  
  // Try to match by game prefix
  const gamePrefix = badgeId.split('_')[0];
  const gameMatch = Object.keys(BADGE_IMAGES).find(key => key.startsWith(gamePrefix));
  if (gameMatch) {
    return BADGE_IMAGES[gameMatch];
  }
  
  // Default fallback
  return BADGE_IMAGES['plays_5'];
};

export default BADGE_IMAGES;
