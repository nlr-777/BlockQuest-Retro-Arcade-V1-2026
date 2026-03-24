// BlockQuest Official - Apertum Service Stub
// NFT metadata and badge configuration types

export interface NFTBadgeMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface BadgeReward {
  xp: number;
  powerUp?: string;
  title?: string;
  booster?: string;
  multiplier?: number;
}

export const APERTUM_CONFIG = {
  enabled: false,
  apiEndpoint: '',
  collectionId: '',
};

// Placeholder functions for future NFT integration
export const mintBadgeNFT = async (metadata: NFTBadgeMetadata): Promise<string | null> => {
  console.log('NFT minting disabled - badge stored locally');
  return null;
};

export const verifyBadgeOwnership = async (badgeId: string, walletAddress: string): Promise<boolean> => {
  return false;
};
