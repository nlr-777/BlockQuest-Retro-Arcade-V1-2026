// Block Quest Official - 80s/90s Retro Color Palette
// Synthwave / Arcade Aesthetic

export const COLORS = {
  // Neon Primary Colors
  neonPink: '#FF00FF',
  neonCyan: '#00FFFF',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  neonYellow: '#FFFF00',
  neonPurple: '#BF00FF',
  neonBlue: '#00BFFF',
  neonRed: '#FF073A',
  
  // Golden Arcade
  primary: '#FFD700',
  secondary: '#00FFFF',
  accent: '#FF00FF',
  
  // Synthwave Gradients Base Colors
  synthPink: '#FF6AD5',
  synthPurple: '#8B5CF6',
  synthBlue: '#6366F1',
  synthCyan: '#06B6D4',
  
  // Background Layers (Dark to create depth)
  bgDark: '#0D0221',      // Deep purple-black
  bgMedium: '#150734',    // Dark purple
  bgLight: '#1F1147',     // Medium purple
  bgAccent: '#2D1B69',    // Lighter purple
  
  // Gradient stops for synthwave sunset
  sunsetTop: '#0D0221',
  sunsetMid: '#5B21B6',
  sunsetBottom: '#FF6AD5',
  
  // UI Elements
  cardBg: 'rgba(30, 10, 60, 0.8)',
  cardBorder: '#FF00FF',
  cardGlow: 'rgba(255, 0, 255, 0.3)',
  
  // Text colors - all SUPER bright for kids to read easily
  textPrimary: '#FFFFFF',
  textSecondary: '#F8F0FF',  // BRIGHTENED - very light purple-white
  textMuted: '#EED8FF',      // BRIGHTENED - light lavender, easy to read!
  textGlow: '#00FFFF',
  
  // Game-specific (keeping original names for compatibility)
  chainGold: '#FFD700',
  blockCyan: '#00FFFF',
  hashGreen: '#39FF14',
  tokenPurple: '#BF00FF',
  seedRed: '#FF073A',
  
  // Status colors (neon versions)
  success: '#39FF14',
  warning: '#FF6600',
  error: '#FF073A',
  info: '#00BFFF',
  
  // VFX colors
  vfxGlow: '#FF00FF',
  vfxScan: '#00FFFF',
  vfxAlert: '#FF073A',
  vfxLightning: '#FFFF00',
  vfxGrid: '#FF00FF',
  
  // Rarity colors (for badges) - brightened for visibility
  rarityCommon: '#C0C0C0',    // Bright silver
  rarityRare: '#00BFFF',
  rarityEpic: '#BF00FF',
  rarityLegendary: '#FFD700',
};

// Gradient definitions for use with LinearGradient
export const GRADIENTS = {
  synthwave: ['#0D0221', '#5B21B6', '#FF6AD5'],
  neonPink: ['#FF00FF', '#FF6AD5'],
  neonCyan: ['#00FFFF', '#06B6D4'],
  sunset: ['#FF6AD5', '#FF00FF', '#5B21B6', '#0D0221'],
  gold: ['#FFD700', '#FFA500', '#FF6600'],
  arcade: ['#00FFFF', '#FF00FF'],
};
