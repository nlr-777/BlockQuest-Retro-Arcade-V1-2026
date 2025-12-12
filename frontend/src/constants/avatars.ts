// BlockQuest Official - Avatar Definitions
// 6 Pixelated blockchain-themed avatars with backstories for the arcade timeline

export interface AvatarConfig {
  id: string;
  name: string;
  title: string;
  story: string;
  era: string;
  specialPower: string;
  imageUrl: string;
  color: string;
  glowColor: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

// The BlockQuest Timeline - Each avatar represents an era in the arcade's history
export const AVATARS: AvatarConfig[] = [
  {
    id: 'genesis-byte',
    name: 'Genesis Byte',
    title: 'The First Player',
    story: 'Born from the first block ever created. Genesis was the original arcade champion who discovered the power of chaining blocks together.',
    era: 'Era 1: The Beginning',
    specialPower: '+10% Score Bonus',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art1.webp',
    color: '#FF00FF',
    glowColor: 'rgba(255, 0, 255, 0.5)',
    rarity: 'Common',
  },
  {
    id: 'neon-runner',
    name: 'Neon Runner',
    title: 'Speed Demon',
    story: 'A legendary speedrunner from the Grid Wars era. Neon mastered the art of lightning-fast reflexes and holds records in every game.',
    era: 'Era 2: The Grid Wars',
    specialPower: '+15% Speed Boost',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art3.jpg',
    color: '#00BFFF',
    glowColor: 'rgba(0, 191, 255, 0.5)',
    rarity: 'Common',
  },
  {
    id: 'pixel-sage',
    name: 'Pixel Sage',
    title: 'The Wise One',
    story: 'An ancient code master who learned the secrets of the arcade. The Sage teaches young players the wisdom of patience and strategy.',
    era: 'Era 3: The Enlightenment',
    specialPower: '+20% XP Gain',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art4.jpg',
    color: '#39FF14',
    glowColor: 'rgba(57, 255, 20, 0.5)',
    rarity: 'Rare',
  },
  {
    id: 'synth-striker',
    name: 'Synth Striker',
    title: 'Beat Master',
    story: 'Born during the Synthwave Revolution, this warrior fights to the rhythm. Every action syncs perfectly with the arcade\'s pulse.',
    era: 'Era 4: Synthwave Revolution',
    specialPower: 'Music Sync VFX',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art5.jpg',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    rarity: 'Rare',
  },
  {
    id: 'cyber-phoenix',
    name: 'Cyber Phoenix',
    title: 'The Reborn',
    story: 'A legendary player who fell but rose again from digital ashes. The Phoenix never gives up and gains power with each retry.',
    era: 'Era 5: The Rebirth',
    specialPower: 'Extra Life Start',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art6.jpg',
    color: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.5)',
    rarity: 'Epic',
  },
  {
    id: 'void-walker',
    name: 'Void Walker',
    title: 'Master of All',
    story: 'The ultimate champion who transcended all eras. Void Walker exists between dimensions, commanding powers from every timeline.',
    era: 'Era 6: The Convergence',
    specialPower: 'All Bonuses Active',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art7.jpg',
    color: '#BF00FF',
    glowColor: 'rgba(191, 0, 255, 0.5)',
    rarity: 'Legendary',
  },
];

export const getAvatarById = (id: string): AvatarConfig | undefined => {
  return AVATARS.find(a => a.id === id);
};

export const getAvatarByIndex = (index: number): AvatarConfig => {
  return AVATARS[index % AVATARS.length];
};

export const getRarityColor = (rarity: AvatarConfig['rarity']): string => {
  switch (rarity) {
    case 'Legendary': return '#BF00FF';
    case 'Epic': return '#FF6B6B';
    case 'Rare': return '#FFD700';
    default: return '#888888';
  }
};
