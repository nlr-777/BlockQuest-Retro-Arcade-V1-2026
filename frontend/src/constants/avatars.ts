// BlockQuest Official - Avatar Definitions
// 6 Pixelated blockchain-themed avatars for player selection

export interface AvatarConfig {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
  rarity: 'Common' | 'Rare' | 'Epic';
}

export const AVATARS: AvatarConfig[] = [
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    description: 'Neon rebel with attitude',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art1.webp',
    color: '#FF00FF',
    rarity: 'Common',
  },
  {
    id: 'tech-ninja',
    name: 'Tech Ninja',
    description: 'Silent digital warrior',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art3.jpg',
    color: '#00BFFF',
    rarity: 'Common',
  },
  {
    id: 'neon-racer',
    name: 'Neon Racer',
    description: 'Speed through the grid',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art4.jpg',
    color: '#FFD700',
    rarity: 'Rare',
  },
  {
    id: 'pixel-hacker',
    name: 'Pixel Hacker',
    description: 'Master of the code',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art5.jpg',
    color: '#39FF14',
    rarity: 'Rare',
  },
  {
    id: 'synth-rider',
    name: 'Synth Rider',
    description: 'Rides the digital waves',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art6.jpg',
    color: '#FF6B6B',
    rarity: 'Epic',
  },
  {
    id: 'block-master',
    name: 'Block Master',
    description: 'Legend of the chain',
    imageUrl: 'https://img.craftpix.net/2021/05/Free-3-Cyberpunk-Characters-Pixel-Art7.jpg',
    color: '#BF00FF',
    rarity: 'Epic',
  },
];

export const getAvatarById = (id: string): AvatarConfig | undefined => {
  return AVATARS.find(a => a.id === id);
};

export const getAvatarByIndex = (index: number): AvatarConfig => {
  return AVATARS[index % AVATARS.length];
};
