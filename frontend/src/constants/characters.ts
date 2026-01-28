// BlockQuest Official - Web3 Chaos Chronicles Characters
// 5 Main Characters + 1 Legendary Collective
// Replacing generic heroes with story-driven characters

export type CharacterRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface CharacterAbility {
  name: string;
  description: string;
  bonus: number; // percentage bonus
  affectedGames: string[]; // game IDs that get the bonus
  icon: string;
}

export interface CharacterDialogue {
  gameStart: string[];
  victory: string[];
  defeat: string[];
  encouragement: string[];
  struggling: string[];
  education: string[];
}

export interface CharacterConfig {
  id: string;
  name: string;
  fullName: string;
  title: string;
  age: number;
  backstory: string;
  era: string;
  eraTag: string;
  catchphrase: string;
  rarity: CharacterRarity;
  
  // Unlock requirements
  unlockRequirement: {
    type: 'default' | 'points' | 'games' | 'level' | 'characters';
    value: number;
    description: string;
  };
  
  // Visual
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  imageUrl: string;
  
  // Abilities
  specialAbility: CharacterAbility;
  
  // Dialogue
  dialogue: CharacterDialogue;
}

// ===== WEB3 CHAOS CHRONICLES CHARACTERS =====

export const CHARACTERS: CharacterConfig[] = [
  // ZARA "THE BUILDER" CHEN - Starter Character
  {
    id: 'zara',
    name: 'Zara',
    fullName: 'Zara "The Builder" Chen',
    title: 'The Visionary Coder',
    age: 15,
    backstory: 'The visionary coder who sees patterns in chaos. Started Quest Coins in her garage and never looked back. She believes code can change the world.',
    era: 'Era 1: The Builders',
    eraTag: '◆ Era 1: The Builders',
    catchphrase: "Let's build something legendary.",
    rarity: 'Common',
    
    unlockRequirement: {
      type: 'default',
      value: 0,
      description: 'Starter Character',
    },
    
    colors: {
      primary: '#9D4EDD',
      secondary: '#7B2CBF',
      accent: '#C77DFF',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Code Boost',
      description: '+15% score on building games',
      bonus: 15,
      affectedGames: ['contract-crusher', 'quest-vault', 'dao-duel'],
      icon: '⚡',
    },
    
    dialogue: {
      gameStart: [
        "Let's build something legendary.",
        "Time to write some history.",
        "Every great project starts with a single line of code.",
      ],
      victory: [
        "Code executed perfectly!",
        "That's how you ship a feature!",
        "Another successful build!",
      ],
      defeat: [
        "Debugging time...",
        "Every bug teaches us something.",
        "Let's refactor and try again.",
      ],
      encouragement: [
        "Your logic is flawless. Keep going!",
        "I see the pattern. You've got this!",
        "Nice thinking! Keep building!",
      ],
      struggling: [
        "Take a breath. We can debug this.",
        "Every error is a learning opportunity.",
        "Step by step. You're close!",
      ],
      education: [
        "Smart contracts can't lie. They execute exactly as written.",
        "Building trust through code!",
      ],
    },
  },
  
  // SAM "THE SKEPTIC" RODRIGUEZ - Unlocks at 100 points
  {
    id: 'sam',
    name: 'Sam',
    fullName: 'Sam "The Skeptic" Rodriguez',
    title: 'The Reality Checker',
    age: 14,
    backstory: 'The group\'s reality checker who questions everything. Sam protects the team from scams and bad ideas with healthy skepticism and sharp instincts.',
    era: 'Era 2: The Skeptics',
    eraTag: '◆ Era 2: The Skeptics',
    catchphrase: "Yeah, I'm gonna need to see the code first.",
    rarity: 'Common',
    
    unlockRequirement: {
      type: 'points',
      value: 100,
      description: 'Earn 100 total points',
    },
    
    colors: {
      primary: '#FF7F50',
      secondary: '#E5673D',
      accent: '#FFA07A',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Scam Shield',
      description: '+20% score on defensive games',
      bonus: 20,
      affectedGames: ['bridge-bouncer', 'hash-hopper', 'ledger-leap'],
      icon: '🛡️',
    },
    
    dialogue: {
      gameStart: [
        "Yeah, I'm gonna need to see the code first.",
        "Let me verify this...",
        "Trust but verify, right?",
      ],
      victory: [
        "See? I knew something was off.",
        "Skepticism pays off!",
        "Verified and validated!",
      ],
      defeat: [
        "Should've trusted my gut.",
        "Let's review what went wrong.",
        "Time to audit the situation.",
      ],
      encouragement: [
        "You're catching on. Keep questioning!",
        "Good instincts! Trust them.",
        "That's the right amount of skepticism!",
      ],
      struggling: [
        "Don't panic. Analyze the situation.",
        "Sometimes the obvious answer is a trap.",
        "Take your time. Think it through.",
      ],
      education: [
        "Always verify before you trust.",
        "If it seems too good to be true, check twice!",
      ],
    },
  },
  
  // MIKO "THE ARTIST" TANAKA - Unlocks after completing 5 games
  {
    id: 'miko',
    name: 'Miko',
    fullName: 'Miko "The Artist" Tanaka',
    title: 'The Creative Genius',
    age: 15,
    backstory: 'The artist who turns code into art. Miko created the Quest Coins NFT collection and believes creativity should be owned by creators.',
    era: 'Era 3: The Creators',
    eraTag: '◆ Era 3: The Creators',
    catchphrase: "Let's make it weird AND functional.",
    rarity: 'Rare',
    
    unlockRequirement: {
      type: 'games',
      value: 5,
      description: 'Complete 5 different games',
    },
    
    colors: {
      primary: '#00CED1',
      secondary: '#20B2AA',
      accent: '#40E0D0',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Creative Surge',
      description: '+25% score on creative games',
      bonus: 25,
      affectedGames: ['ipfs-pinball', 'crypto-climber', 'token-tumble'],
      icon: '🎨',
    },
    
    dialogue: {
      gameStart: [
        "Let's make it weird AND functional.",
        "Time to create something unique!",
        "Art meets code. Let's go!",
      ],
      victory: [
        "Now THAT'S a masterpiece!",
        "Creativity wins again!",
        "Beautiful and functional!",
      ],
      defeat: [
        "Even failures are art.",
        "Back to the drawing board.",
        "First draft. Time to revise.",
      ],
      encouragement: [
        "Your style is showing! Love it!",
        "So creative! Keep experimenting!",
        "You're making something unique here!",
      ],
      struggling: [
        "Art takes time. Don't rush.",
        "Try something unexpected!",
        "Creativity is messy. That's okay!",
      ],
      education: [
        "Every creation is one-of-a-kind, just like you!",
        "Owning your art means owning your future.",
      ],
    },
  },
  
  // OLLIE "THE GAMER" OKAFOR - Unlocks at 500 points
  {
    id: 'ollie',
    name: 'Ollie',
    fullName: 'Ollie "The Gamer" Okafor',
    title: 'The Speedrunner',
    age: 13,
    backstory: 'The ultimate play-to-earn tester who finds every exploit. Ollie turned gaming into a science and knows every trick in the book.',
    era: 'Era 4: The Players',
    eraTag: '◆ Era 4: The Players',
    catchphrase: "Time to speedrun this blockchain.",
    rarity: 'Rare',
    
    unlockRequirement: {
      type: 'points',
      value: 500,
      description: 'Earn 500 total points',
    },
    
    colors: {
      primary: '#32CD32',
      secondary: '#228B22',
      accent: '#7CFC00',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Gamer Reflex',
      description: '+30% score on fast-paced games',
      bonus: 30,
      affectedGames: ['lightning-dash', 'mine-blaster', 'seed-sprint'],
      icon: '🎮',
    },
    
    dialogue: {
      gameStart: [
        "Time to speedrun this blockchain.",
        "New high score incoming!",
        "LET'S GOOO!",
      ],
      victory: [
        "World record pace!",
        "GG EZ!",
        "That's how you speedrun!",
      ],
      defeat: [
        "Bad RNG...",
        "Reset and go again!",
        "Sub-optimal route. Noted.",
      ],
      encouragement: [
        "Your reflexes are FAST!",
        "You're in the zone!",
        "Frame-perfect execution!",
      ],
      struggling: [
        "Every speedrunner fails. A lot.",
        "Practice makes perfect splits.",
        "Learn the patterns. You got this.",
      ],
      education: [
        "Gaming can be rewarding in more ways than one!",
        "Play smart, not just fast!",
      ],
    },
  },
  
  // LILA "THE CONNECTOR" NAKAMURA - Unlocks at Level 10
  {
    id: 'lila',
    name: 'Lila',
    fullName: 'Lila "The Connector" Nakamura',
    title: 'The Community Builder',
    age: 16,
    backstory: 'The community architect who brings people together. Lila organized the first Quest Coins DAO and believes the best ideas come from collaboration.',
    era: 'Era 5: The Connectors',
    eraTag: '◆ Era 5: The Connectors',
    catchphrase: "We're stronger together. Let's vote on it.",
    rarity: 'Epic',
    
    unlockRequirement: {
      type: 'level',
      value: 10,
      description: 'Reach Level 10',
    },
    
    colors: {
      primary: '#FFD700',
      secondary: '#DAA520',
      accent: '#FFEC8B',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Community Power',
      description: '+35% score on team games',
      bonus: 35,
      affectedGames: ['dao-duel', 'chain-invaders', 'quest-vault'],
      icon: '🤝',
    },
    
    dialogue: {
      gameStart: [
        "We're stronger together. Let's vote on it.",
        "Teamwork makes the dream work!",
        "Let's build consensus!",
      ],
      victory: [
        "Together we're unstoppable!",
        "Community wins!",
        "That's the power of teamwork!",
      ],
      defeat: [
        "We learn together too.",
        "Let's regroup and try again.",
        "Every team has setbacks.",
      ],
      encouragement: [
        "You're really connecting!",
        "The community is with you!",
        "Great team player vibes!",
      ],
      struggling: [
        "Ask for help. That's strength.",
        "No one succeeds alone.",
        "The community has your back!",
      ],
      education: [
        "Together, we can decide anything!",
        "Your voice matters in every vote!",
      ],
    },
  },
  
  // THE COLLECTIVE - Legendary, unlocks after all 5 main characters
  {
    id: 'collective',
    name: 'The Collective',
    fullName: 'The Collective',
    title: 'United Power',
    age: 0, // Not applicable
    backstory: 'When all five friends combine their powers, they become something greater—The Collective. This is what Web3 was always meant to be: everyone together, unstoppable.',
    era: 'Era ∞: The Future',
    eraTag: '◆ Era ∞: The Future',
    catchphrase: "Together, we are the blockchain.",
    rarity: 'Legendary',
    
    unlockRequirement: {
      type: 'characters',
      value: 5,
      description: 'Unlock all 5 main characters',
    },
    
    colors: {
      primary: '#BF00FF',
      secondary: '#9400D3',
      accent: '#DA70D6',
    },
    imageUrl: 'https://customer-assets.emergentagent.com/job_pixelpal-quest/artifacts/obvkodsz_generated_image_20260128_051915_1.png',
    
    specialAbility: {
      name: 'Full Synergy',
      description: '+50% score on ALL games',
      bonus: 50,
      affectedGames: ['all'], // Special flag for all games
      icon: '🌟',
    },
    
    dialogue: {
      gameStart: [
        "Together, we are the blockchain.",
        "Five minds, one purpose.",
        "The future is now.",
      ],
      victory: [
        "This is what we were meant for!",
        "United we conquer!",
        "The collective prevails!",
      ],
      defeat: [
        "Even together, we grow.",
        "We rise again, together.",
        "Every ending is a new beginning.",
      ],
      encouragement: [
        "All powers combined!",
        "You embody the collective spirit!",
        "Maximum synergy achieved!",
      ],
      struggling: [
        "Draw on all our strengths.",
        "Five perspectives, one solution.",
        "We figure this out together.",
      ],
      education: [
        "When we work together, nothing is impossible.",
        "The future belongs to those who build it together.",
      ],
    },
  },
];

// Helper functions
export const getCharacterById = (id: string): CharacterConfig | undefined => {
  return CHARACTERS.find(c => c.id === id);
};

export const getCharacterByIndex = (index: number): CharacterConfig => {
  return CHARACTERS[index % CHARACTERS.length];
};

export const getRarityColor = (rarity: CharacterRarity): string => {
  switch (rarity) {
    case 'Legendary': return '#BF00FF';
    case 'Epic': return '#FFD700';
    case 'Rare': return '#00CED1';
    default: return '#888888';
  };
};

export const getMainCharacters = (): CharacterConfig[] => {
  return CHARACTERS.filter(c => c.id !== 'collective');
};

export const getUnlockableCharacters = (): CharacterConfig[] => {
  return CHARACTERS.filter(c => c.unlockRequirement.type !== 'default');
};

// Get random dialogue from character
export const getRandomDialogue = (
  character: CharacterConfig, 
  type: keyof CharacterDialogue
): string => {
  const dialogues = character.dialogue[type];
  return dialogues[Math.floor(Math.random() * dialogues.length)];
};

// Calculate ability bonus for a game
export const getCharacterBonus = (
  character: CharacterConfig,
  gameId: string
): number => {
  const ability = character.specialAbility;
  
  // The Collective gets bonus on all games
  if (ability.affectedGames.includes('all')) {
    return ability.bonus;
  }
  
  // Check if game is in affected games list
  if (ability.affectedGames.includes(gameId)) {
    return ability.bonus;
  }
  
  return 0;
};
