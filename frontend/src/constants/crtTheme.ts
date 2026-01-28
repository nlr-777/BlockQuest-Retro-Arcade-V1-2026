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
  
  // Text colors - all made brighter for better readability
  textBright: '#00FF41',
  textDim: '#66FF99',      // Brightened from #00AA33 for better readability
  textMuted: '#44DD77',    // Brightened from #006622 for better readability  
  textSecondary: '#88FFBB', // New bright secondary text color
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

// Pun messages for different events - KID-FRIENDLY DAD JOKES ONLY!
export const CRT_PUNS = {
  welcome: [
    '🚀 Ready to stack some blocks?',
    '⬡ Time to build your blockchain!',
    '💎 Let\'s go mining for fun!',
    '🔗 Chain your way to victory!',
  ],
  win: [
    'You\'re on a ROLL! 🎲',
    'That was BLOCK-buster! 🧱',
    'You really CHAINED that together! 🔗',
    'HASH-tag amazing! #️⃣',
    'You MINED your own business! ⛏️',
    'That was NODE-thing short of awesome! 🖥️',
  ],
  fail: [
    'Whoops! Block-ed! 🧱',
    'Don\'t worry, every chain has weak LINKS! 🔗',
    'Time to HASH it out again! #️⃣',
    'That was un-FORK-tunate! 🍴',
    'Let\'s give it another BLOCK! 🧱',
    'Oops! NODE worries, try again! 🖥️',
  ],
  milestone: [
    'You\'re really STACKING up points! 📚',
    'CHAIN-ge is good! Keep going! 🔗',
    'You\'re MINING your own business! ⛏️',
    'HASH-tag crushing it! #️⃣',
    'You\'re on FIRE! 🔥 (Not literally)',
    'BLOCK and roll! 🎸',
  ],
  dadJokes: [
    'Why did the block go to school? To get a little CHAIN-ge! 🎓',
    'What do you call a sleeping blockchain? A block-NAP! 😴',
    'Why are blockchains so honest? They can\'t tell a FIB-onacci! 🤥',
    'What\'s a blockchain\'s favorite music? HASH metal! 🎸',
    'Why did the node break up? It needed more SPACE! 🚀',
    'What do blocks eat for breakfast? HASH browns! 🥔',
    'Why was the blockchain cold? It left its WALLET at home! 👛',
    'What\'s a block\'s favorite dance? The CHAIN-chain slide! 💃',
    'Why do blocks make great friends? They\'re always LINKED! 🔗',
    'What did one block say to another? Let\'s STICK together! 🧱',
    'Why are puzzles like blockchains? They\'re both about CONNECTIONS! 🧩',
    'What\'s a computer\'s favorite snack? MICRO-chips! 🍟',
    'Why did the game go to the doctor? It had too many BUGS! 🐛',
    'What do you call a funny blockchain? A COMEDY chain! 😂',
    'Why do blocks never get lost? They always follow the CHAIN! 🗺️',
  ],
  dailyQuests: [
    { id: 'bridge_quest', joke: 'Why did the data cross the bridge? To get to the other CHAIN! 🌉', task: 'Play Bridge Bouncer' },
    { id: 'hash_quest', joke: 'What do you call a magical hash? ABRA-cadabra-data! ✨', task: 'Match 10 hashes' },
    { id: 'stack_quest', joke: 'Why are blocks so polite? They always stack in LINE! 📚', task: 'Stack 20 blocks' },
    { id: 'chain_quest', joke: 'What\'s a chain\'s favorite game? LINK-o! 🎯', task: 'Build 5 chains' },
    { id: 'speed_quest', joke: 'Why was the transaction so fast? It took a SHORT-cut! ⚡', task: 'Beat Lightning Dash' },
    { id: 'mine_quest', joke: 'What did the miner say? This ROCKS! 🪨', task: 'Mine 15 blocks' },
    { id: 'seed_quest', joke: 'Why do seeds make good secrets? They\'re planted DEEP! 🌱', task: 'Collect 12 seeds' },
  ],
};

export default { CRT_COLORS, CRT_CONFIG, CRT_PUNS, HEX_BORDER_PATH, PALETTE_16BIT };
