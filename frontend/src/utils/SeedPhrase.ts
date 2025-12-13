// BlockQuest Official - Seed Phrase Backup System
// Kid-friendly 12-word phrase for cross-device progress sync

// Kid-safe word list (simple, memorable, fun words)
const WORD_LIST = [
  // Animals
  'dragon', 'phoenix', 'tiger', 'eagle', 'dolphin', 'panda', 'falcon', 'wolf',
  'rabbit', 'turtle', 'koala', 'penguin', 'lion', 'bear', 'fox', 'owl',
  // Colors
  'golden', 'silver', 'purple', 'orange', 'blue', 'green', 'red', 'pink',
  'crystal', 'rainbow', 'neon', 'cosmic', 'bright', 'shiny', 'glowing', 'sparkle',
  // Gaming
  'power', 'quest', 'level', 'score', 'bonus', 'combo', 'super', 'mega',
  'turbo', 'hyper', 'ultra', 'master', 'hero', 'champion', 'legend', 'winner',
  // Space/Tech
  'rocket', 'planet', 'comet', 'galaxy', 'star', 'moon', 'solar', 'cyber',
  'pixel', 'digital', 'quantum', 'laser', 'circuit', 'binary', 'data', 'code',
  // Nature
  'forest', 'ocean', 'mountain', 'river', 'thunder', 'lightning', 'storm', 'flame',
  'ice', 'wind', 'earth', 'cloud', 'sunrise', 'sunset', 'aurora', 'meteor',
  // Objects
  'shield', 'sword', 'crown', 'gem', 'diamond', 'ruby', 'emerald', 'sapphire',
  'treasure', 'castle', 'tower', 'bridge', 'portal', 'key', 'chest', 'coin',
  // Actions
  'jump', 'dash', 'blast', 'zoom', 'spin', 'bounce', 'flying', 'racing',
  'climbing', 'diving', 'soaring', 'gliding', 'rolling', 'sliding', 'leaping', 'running',
  // Fun
  'happy', 'lucky', 'magic', 'wonder', 'dream', 'brave', 'mighty', 'swift',
  'clever', 'noble', 'epic', 'awesome', 'amazing', 'fantastic', 'incredible', 'supreme'
];

export interface BackupData {
  version: number;
  username: string;
  avatarId: string;
  totalScore: number;
  gamesPlayed: number;
  highScores: Record<string, number>;
  badges: string[]; // badge IDs
  createdAt: number;
  checksum: string;
}

// Simple hash function for checksum
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

// Convert data to a deterministic number sequence
const dataToNumbers = (data: BackupData): number[] => {
  const str = JSON.stringify({
    u: data.username,
    a: data.avatarId,
    s: data.totalScore,
    g: data.gamesPlayed,
    h: data.highScores,
    b: data.badges,
    c: data.createdAt,
  });
  
  const numbers: number[] = [];
  let seed = 0;
  
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) % 2147483647;
  }
  
  // Generate 12 numbers from the seed
  for (let i = 0; i < 12; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    numbers.push(seed % WORD_LIST.length);
  }
  
  return numbers;
};

// Generate 12-word seed phrase from backup data
export const generateSeedPhrase = (data: BackupData): string => {
  const checksum = simpleHash(JSON.stringify(data));
  const dataWithChecksum = { ...data, checksum };
  const numbers = dataToNumbers(dataWithChecksum);
  
  const words = numbers.map(n => WORD_LIST[n]);
  return words.join(' ');
};

// Encode backup data into seed phrase
export const encodeBackup = (
  username: string,
  avatarId: string,
  totalScore: number,
  gamesPlayed: number,
  highScores: Record<string, number>,
  badges: { id: string }[],
  createdAt: number
): string => {
  const data: BackupData = {
    version: 1,
    username,
    avatarId,
    totalScore,
    gamesPlayed,
    highScores,
    badges: badges.map(b => b.id),
    createdAt,
    checksum: '',
  };
  
  // Create a compact encoded string
  const compact = {
    v: 1,
    u: username.substring(0, 12),
    a: avatarId,
    s: totalScore,
    g: gamesPlayed,
    h: highScores,
    b: badges.map(b => b.id),
    t: createdAt,
  };
  
  // Base64 encode the data
  const jsonStr = JSON.stringify(compact);
  const encoded = btoa(encodeURIComponent(jsonStr));
  
  // Generate memorable phrase as display (the actual data is in encoded form)
  const displayPhrase = generateSeedPhrase(data);
  
  return `${displayPhrase}|${encoded}`;
};

// Decode seed phrase back to backup data
export const decodeBackup = (seedPhrase: string): BackupData | null => {
  try {
    // Check if it's the new format with encoded data
    if (seedPhrase.includes('|')) {
      const [, encoded] = seedPhrase.split('|');
      const jsonStr = decodeURIComponent(atob(encoded));
      const compact = JSON.parse(jsonStr);
      
      return {
        version: compact.v || 1,
        username: compact.u,
        avatarId: compact.a,
        totalScore: compact.s,
        gamesPlayed: compact.g,
        highScores: compact.h || {},
        badges: compact.b || [],
        createdAt: compact.t,
        checksum: '',
      };
    }
    
    // Legacy format - just words (can't decode, but validate)
    const words = seedPhrase.toLowerCase().trim().split(/\s+/);
    if (words.length !== 12) {
      return null;
    }
    
    // Check all words are valid
    const allValid = words.every(w => WORD_LIST.includes(w));
    if (!allValid) {
      return null;
    }
    
    // Can't decode legacy format
    return null;
  } catch (e) {
    console.error('Failed to decode backup:', e);
    return null;
  }
};

// Validate a seed phrase format
export const validateSeedPhrase = (phrase: string): boolean => {
  if (phrase.includes('|')) {
    try {
      const decoded = decodeBackup(phrase);
      return decoded !== null;
    } catch {
      return false;
    }
  }
  
  const words = phrase.toLowerCase().trim().split(/\s+/);
  if (words.length !== 12) return false;
  return words.every(w => WORD_LIST.includes(w));
};

// Generate a simple display phrase (12 random words)
export const generateDisplayPhrase = (): string => {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    words.push(WORD_LIST[randomIndex]);
  }
  return words.join(' ');
};

export default {
  generateSeedPhrase,
  encodeBackup,
  decodeBackup,
  validateSeedPhrase,
  generateDisplayPhrase,
  WORD_LIST,
};
