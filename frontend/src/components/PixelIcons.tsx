// Block Quest Official - Custom Pixel Art Blockchain Icons
// No emojis - pure retro pixel art!
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

// Pixel Block Chain Icon
export const IconBlockChain: React.FC<IconProps> = ({ size = 32, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="2" y="2" width="10" height="10" fill={color} />
    <Rect x="4" y="4" width="6" height="6" fill="#000" opacity="0.3" />
    <Rect x="14" y="8" width="4" height="4" fill={color} opacity="0.7" />
    <Rect x="20" y="12" width="10" height="10" fill={color} />
    <Rect x="22" y="14" width="6" height="6" fill="#000" opacity="0.3" />
    <Rect x="8" y="14" width="4" height="4" fill={color} opacity="0.7" />
    <Rect x="2" y="20" width="10" height="10" fill={color} />
    <Rect x="4" y="22" width="6" height="6" fill="#000" opacity="0.3" />
  </Svg>
);

// Pixel Wallet Icon
export const IconWallet: React.FC<IconProps> = ({ size = 32, color = '#00CED1' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="2" y="6" width="28" height="20" fill={color} />
    <Rect x="4" y="8" width="24" height="16" fill="#000" opacity="0.2" />
    <Rect x="20" y="12" width="10" height="8" fill="#FFF" opacity="0.9" />
    <Rect x="22" y="14" width="6" height="4" fill={color} />
    <Circle cx="25" cy="16" r="2" fill="#FFD700" />
    <Rect x="2" y="6" width="28" height="4" fill={color} />
    <Rect x="4" y="4" width="8" height="4" fill={color} />
  </Svg>
);

// Pixel Ghost (Pac-Man style)
export const IconGhost: React.FC<IconProps> = ({ size = 32, color = '#FF6B6B' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path d="M8 4 H24 V6 H26 V8 H28 V24 H26 V28 H24 V24 H22 V28 H18 V24 H14 V28 H10 V24 H8 V28 H6 V24 H4 V8 H6 V6 H8 V4" fill={color} />
    <Rect x="10" y="10" width="4" height="6" fill="#FFF" />
    <Rect x="12" y="12" width="2" height="4" fill="#00F" />
    <Rect x="18" y="10" width="4" height="6" fill="#FFF" />
    <Rect x="20" y="12" width="2" height="4" fill="#00F" />
  </Svg>
);

// Pixel Token/Coin
export const IconToken: React.FC<IconProps> = ({ size = 32, color = '#9400D3' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Circle cx="16" cy="16" r="14" fill={color} />
    <Circle cx="16" cy="16" r="11" fill="#000" opacity="0.2" />
    <Circle cx="16" cy="16" r="8" fill={color} />
    <Rect x="14" y="8" width="4" height="16" fill="#FFF" opacity="0.8" />
    <Rect x="10" y="12" width="12" height="4" fill="#FFF" opacity="0.8" />
    <Rect x="10" y="18" width="12" height="2" fill="#FFF" opacity="0.6" />
  </Svg>
);

// Pixel Alien/Invader
export const IconInvader: React.FC<IconProps> = ({ size = 32, color = '#32CD32' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="4" y="4" width="4" height="4" fill={color} />
    <Rect x="24" y="4" width="4" height="4" fill={color} />
    <Rect x="8" y="8" width="16" height="4" fill={color} />
    <Rect x="4" y="12" width="24" height="4" fill={color} />
    <Rect x="4" y="16" width="4" height="4" fill={color} />
    <Rect x="12" y="16" width="8" height="4" fill={color} />
    <Rect x="24" y="16" width="4" height="4" fill={color} />
    <Rect x="8" y="20" width="4" height="4" fill={color} />
    <Rect x="20" y="20" width="4" height="4" fill={color} />
    <Rect x="10" y="10" width="4" height="4" fill="#FFF" />
    <Rect x="18" y="10" width="4" height="4" fill="#FFF" />
  </Svg>
);

// Pixel Frog
export const IconFrog: React.FC<IconProps> = ({ size = 32, color = '#00FF00' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="6" y="4" width="6" height="6" fill={color} />
    <Rect x="20" y="4" width="6" height="6" fill={color} />
    <Rect x="8" y="6" width="4" height="4" fill="#FFF" />
    <Rect x="20" y="6" width="4" height="4" fill="#FFF" />
    <Rect x="10" y="8" width="2" height="2" fill="#000" />
    <Rect x="20" y="8" width="2" height="2" fill="#000" />
    <Rect x="4" y="10" width="24" height="10" fill={color} />
    <Rect x="12" y="16" width="8" height="2" fill="#FF6B6B" />
    <Rect x="6" y="20" width="8" height="6" fill={color} />
    <Rect x="18" y="20" width="8" height="6" fill={color} />
    <Rect x="4" y="24" width="4" height="4" fill={color} />
    <Rect x="24" y="24" width="4" height="4" fill={color} />
  </Svg>
);

// Pixel Runner
export const IconRunner: React.FC<IconProps> = ({ size = 32, color = '#FF6347' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Circle cx="16" cy="6" r="4" fill="#FFD700" />
    <Rect x="14" y="10" width="6" height="10" fill={color} />
    <Rect x="10" y="12" width="4" height="2" fill={color} />
    <Rect x="20" y="14" width="6" height="2" fill={color} />
    <Rect x="12" y="20" width="4" height="8" fill={color} />
    <Rect x="18" y="20" width="4" height="6" fill={color} />
    <Rect x="20" y="24" width="4" height="4" fill={color} />
  </Svg>
);

// Pixel Hash/Code
export const IconHash: React.FC<IconProps> = ({ size = 32, color = '#00FFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="8" y="2" width="4" height="28" fill={color} />
    <Rect x="20" y="2" width="4" height="28" fill={color} />
    <Rect x="2" y="8" width="28" height="4" fill={color} />
    <Rect x="2" y="20" width="28" height="4" fill={color} />
  </Svg>
);

// Pixel Tetris Block
export const IconTetris: React.FC<IconProps> = ({ size = 32, color = '#00CED1' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="4" y="4" width="8" height="8" fill="#FF6B6B" stroke="#FFF" strokeWidth="1" />
    <Rect x="12" y="4" width="8" height="8" fill="#FFD700" stroke="#FFF" strokeWidth="1" />
    <Rect x="12" y="12" width="8" height="8" fill="#32CD32" stroke="#FFF" strokeWidth="1" />
    <Rect x="12" y="20" width="8" height="8" fill="#00CED1" stroke="#FFF" strokeWidth="1" />
    <Rect x="20" y="12" width="8" height="8" fill="#9400D3" stroke="#FFF" strokeWidth="1" />
  </Svg>
);

// Pixel Key (for seed phrases)
export const IconKey: React.FC<IconProps> = ({ size = 32, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Circle cx="10" cy="10" r="8" fill={color} />
    <Circle cx="10" cy="10" r="4" fill="#000" opacity="0.3" />
    <Rect x="14" y="8" width="16" height="4" fill={color} />
    <Rect x="22" y="12" width="4" height="6" fill={color} />
    <Rect x="28" y="12" width="4" height="4" fill={color} />
  </Svg>
);

// Pixel Shield
export const IconShield: React.FC<IconProps> = ({ size = 32, color = '#4169E1' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path d="M16 2 L4 8 V16 C4 24 16 30 16 30 C16 30 28 24 28 16 V8 L16 2" fill={color} />
    <Path d="M16 6 L8 10 V16 C8 22 16 26 16 26 C16 26 24 22 24 16 V10 L16 6" fill="#FFF" opacity="0.3" />
    <Rect x="14" y="12" width="4" height="10" fill="#FFF" />
    <Rect x="10" y="14" width="12" height="4" fill="#FFF" />
  </Svg>
);

// Pixel Crown (for achievements)
export const IconCrown: React.FC<IconProps> = ({ size = 32, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="4" y="20" width="24" height="8" fill={color} />
    <Rect x="4" y="12" width="4" height="8" fill={color} />
    <Rect x="14" y="8" width="4" height="12" fill={color} />
    <Rect x="24" y="12" width="4" height="8" fill={color} />
    <Rect x="2" y="8" width="4" height="4" fill={color} />
    <Rect x="14" y="4" width="4" height="4" fill={color} />
    <Rect x="26" y="8" width="4" height="4" fill={color} />
    <Circle cx="4" cy="8" r="2" fill="#FF0000" />
    <Circle cx="16" cy="6" r="2" fill="#00FF00" />
    <Circle cx="28" cy="8" r="2" fill="#0000FF" />
  </Svg>
);

// Pixel Vault/Safe
export const IconVault: React.FC<IconProps> = ({ size = 32, color = '#708090' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="2" y="4" width="28" height="24" fill={color} />
    <Rect x="4" y="6" width="24" height="20" fill="#000" opacity="0.3" />
    <Circle cx="16" cy="16" r="8" fill="#333" />
    <Circle cx="16" cy="16" r="6" fill="#555" />
    <Rect x="14" y="10" width="4" height="12" fill="#FFD700" />
    <Rect x="10" y="14" width="12" height="4" fill="#FFD700" />
    <Rect x="26" y="12" width="4" height="8" fill="#FFD700" />
  </Svg>
);

// Pixel Lightning
export const IconLightning: React.FC<IconProps> = ({ size = 32, color = '#FFFF00' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path d="M18 2 L8 16 H14 L12 30 L24 14 H18 L20 2 H18" fill={color} />
    <Path d="M16 4 L10 14 H14 L12 26 L22 14 H18 L18 4" fill="#FFF" opacity="0.5" />
  </Svg>
);

// Pixel Mining Pickaxe
export const IconPickaxe: React.FC<IconProps> = ({ size = 32, color = '#8B4513' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="4" y="4" width="12" height="4" fill="#708090" />
    <Rect x="4" y="8" width="4" height="4" fill="#708090" />
    <Rect x="12" y="8" width="4" height="4" fill="#708090" />
    <Rect x="10" y="12" width="4" height="4" fill={color} />
    <Rect x="14" y="16" width="4" height="4" fill={color} />
    <Rect x="18" y="20" width="4" height="4" fill={color} />
    <Rect x="22" y="24" width="6" height="6" fill={color} />
  </Svg>
);

// Pixel Bridge
export const IconBridge: React.FC<IconProps> = ({ size = 32, color = '#00BFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="2" y="20" width="6" height="10" fill="#8B4513" />
    <Rect x="24" y="20" width="6" height="10" fill="#8B4513" />
    <Path d="M4 20 Q16 8 28 20" stroke={color} strokeWidth="4" fill="none" />
    <Rect x="4" y="16" width="4" height="4" fill={color} />
    <Rect x="24" y="16" width="4" height="4" fill={color} />
    <Rect x="14" y="10" width="4" height="4" fill={color} />
  </Svg>
);

// Pixel Star
export const IconStar: React.FC<IconProps> = ({ size = 32, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="14" y="2" width="4" height="8" fill={color} />
    <Rect x="2" y="12" width="28" height="4" fill={color} />
    <Rect x="6" y="16" width="8" height="4" fill={color} />
    <Rect x="18" y="16" width="8" height="4" fill={color} />
    <Rect x="4" y="20" width="6" height="4" fill={color} />
    <Rect x="22" y="20" width="6" height="4" fill={color} />
    <Rect x="2" y="24" width="4" height="4" fill={color} />
    <Rect x="26" y="24" width="4" height="4" fill={color} />
    <Rect x="10" y="10" width="4" height="4" fill={color} />
    <Rect x="18" y="10" width="4" height="4" fill={color} />
  </Svg>
);

// Export all icons as a map for easy access
export const PIXEL_ICONS = {
  'block-muncher': IconGhost,
  'token-tumble': IconTetris,
  'chain-invaders': IconInvader,
  'hash-hopper': IconFrog,
  'seed-sprint': IconRunner,
  'crypto-climber': IconPickaxe,
  'stake-smash': IconShield,
  'ledger-leap': IconBlockChain,
  'dao-duel': IconCrown,
  'mine-blaster': IconPickaxe,
  'lightning-dash': IconLightning,
  'bridge-bouncer': IconBridge,
  'ipfs-pinball': IconStar,
  'contract-crusher': IconHash,
  'quest-vault': IconVault,
  wallet: IconWallet,
  token: IconToken,
  key: IconKey,
  chain: IconBlockChain,
  shield: IconShield,
  crown: IconCrown,
  vault: IconVault,
  lightning: IconLightning,
  star: IconStar,
};

export default PIXEL_ICONS;
