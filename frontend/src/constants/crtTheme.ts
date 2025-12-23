// BlockQuest Official - CRT Terminal Theme
// Ultimate retro green CRT aesthetic

export const CRT_COLORS = {
  // Primary CRT Green palette
  primary: '#00FF41',        // Matrix green
  primaryDim: '#00CC33',     // Dimmed green
  primaryBright: '#33FF66',  // Bright green
  primaryGlow: 'rgba(0, 255, 65, 0.6)',
  
  // Accent colors
  accentCyan: '#00FFFF',
  accentMagenta: '#FF00FF',
  accentGold: '#FFD700',
  accentRed: '#FF3333',
  
  // Background layers (deep dark)
  bgDark: '#001100',         // Near black green
  bgMedium: '#002200',       // Dark green
  bgLight: '#003300',        // Medium green
  bgPanel: 'rgba(0, 34, 0, 0.95)',
  
  // Text colors
  textBright: '#00FF41',
  textDim: '#00AA33',
  textMuted: '#006622',
  textWhite: '#FFFFFF',
  
  // Rarity colors (hex badge borders)
  rarityCommon: '#00FF41',   // Green
  rarityUncommon: '#00FFFF', // Cyan
  rarityRare: '#FF00FF',     // Magenta
  rarityEpic: '#FFD700',     // Gold
  rarityLegendary: '#FF6B6B', // Rainbow base
  
  // Status colors
  success: '#00FF41',
  warning: '#FFD700',
  error: '#FF3333',
  info: '#00FFFF',
  
  // Scanline
  scanline: 'rgba(0, 255, 65, 0.03)',
  scanlineDark: 'rgba(0, 0, 0, 0.4)',
};

// Hex border SVG path (for badges)
export const HEX_BORDER_PATH = 'M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z';

// CRT shader effects config
export const CRT_CONFIG = {
  scanlineOpacity: 0.08,
  scanlineSpeed: 4000,
  glowIntensity: 1.2,
  curveAmount: 0.02,
  flickerChance: 0.05,
  phosphorDecay: 0.95,
  chromaticOffset: 2,
};

// 16-bit color palette (32 colors max)
export const PALETTE_16BIT = [
  '#000000', '#001100', '#002200', '#003300',
  '#004400', '#006600', '#008800', '#00AA00',
  '#00CC00', '#00EE00', '#00FF00', '#00FF41',
  '#33FF33', '#66FF66', '#99FF99', '#CCFFCC',
  '#00FFFF', '#33FFFF', '#00CCCC', '#009999',
  '#FF00FF', '#FF33FF', '#CC00CC', '#990099',
  '#FFD700', '#FFEE00', '#CCAA00', '#997700',
  '#FF3333', '#FF6666', '#CC0000', '#990000',
];

// Pun messages for different events
export const CRT_PUNS = {
  welcome: [
    '🚀 CRACK WEB3 IN 30s!',
    '⬡ STACK BLOCKS, EARN BADGES!',
    '💎 DIAMOND HANDS MODE ACTIVATED!',
    '🔗 CHAIN YOUR WAY TO GLORY!',
  ],
  win: [
    'BLOCK-CHAIN REACTION! 🔥',
    'HASH RATE: MAXIMUM! ⚡',
    'LEDGER LEGEND! 📚',
    'TO THE MOON! 🌙',
    'WAGMI ACHIEVED! 🎉',
  ],
  fail: [
    'REKT! 💀',
    'RUGGED! 🚨',
    '51% ATTACKED! ⚠️',
    'GAS FEES ATE YOUR GAINS!',
    'PAPER HANDS DETECTED!',
  ],
  milestone: [
    "Don't FUD – LINK 'EM!",
    'Hashin\' like a pro... or noob?',
    'HODL that score!',
    'Stacking sats... I mean blocks!',
    'Proof of SKILL achieved!',
  ],
};

export default { CRT_COLORS, CRT_CONFIG, CRT_PUNS, HEX_BORDER_PATH, PALETTE_16BIT };
