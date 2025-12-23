// BlockQuest Official - Game Blockchain Mechanics
// Each game teaches a specific Web3 concept through gameplay
import { COLORS } from './colors';

// Blockchain concept that each game teaches
export interface GameBlockchainMechanics {
  gameId: string;
  concept: string;
  conceptDescription: string;
  
  // Collectibles specific to this game
  collectibles: {
    bqoTokens: {
      count: number;
      spawnPattern: 'random' | 'path' | 'hidden' | 'timed';
      pointsEach: number;
      specialVariant?: string; // Game-specific token type
    };
    nftGems: {
      count: number;
      rarityWeights: { common: number; rare: number; epic: number; legendary: number };
      bonusType: string; // What bonus does the NFT give
    };
    powerups: {
      types: ('shield' | 'speed' | 'magnet' | 'multiplier')[];
      effects: Record<string, string>;
    };
  };
  
  // Hidden educational elements
  hiddenLessons: string[];
  
  // Achievement triggers
  achievements: {
    id: string;
    name: string;
    description: string;
    trigger: string;
    bqoReward: number;
  }[];
  
  // Visual theme overrides
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const GAME_MECHANICS: GameBlockchainMechanics[] = [
  {
    gameId: 'block-muncher',
    concept: 'Blockchain Basics',
    conceptDescription: 'Each block you eat adds to your chain - just like real blockchain transactions!',
    collectibles: {
      bqoTokens: {
        count: 5,
        spawnPattern: 'random',
        pointsEach: 50,
        specialVariant: 'Genesis Block',
      },
      nftGems: {
        count: 3,
        rarityWeights: { common: 50, rare: 30, epic: 15, legendary: 5 },
        bonusType: 'Chain Length Multiplier',
      },
      powerups: {
        types: ['shield', 'speed', 'magnet'],
        effects: {
          shield: 'Ghost Immunity - Your chain is protected!',
          speed: 'Fast Transactions - Move 2x faster',
          magnet: 'Auto-Collect - Blocks come to you',
        },
      },
    },
    hiddenLessons: [
      'Your trail = blockchain history - it cannot be changed!',
      'Ghosts = malicious actors trying to break your chain',
      'Longer chain = more secure network',
    ],
    achievements: [
      { id: 'first_chain', name: 'Genesis Block', description: 'Create your first chain of 10 blocks', trigger: 'chain_length_10', bqoReward: 5 },
      { id: 'long_chain', name: 'Satoshi Mode', description: 'Build a chain of 50 blocks', trigger: 'chain_length_50', bqoReward: 25 },
      { id: 'ghost_dodge', name: 'Consensus Reached', description: 'Survive 3 ghost attacks', trigger: 'survive_3_hits', bqoReward: 10 },
    ],
    themeColors: { primary: COLORS.chainGold, secondary: COLORS.neonCyan, accent: '#FF6B6B' },
  },
  
  {
    gameId: 'chain-invaders',
    concept: 'Network Defense',
    conceptDescription: 'Protect the blockchain network from invading hackers!',
    collectibles: {
      bqoTokens: {
        count: 8,
        spawnPattern: 'path',
        pointsEach: 30,
        specialVariant: 'Node Coin',
      },
      nftGems: {
        count: 2,
        rarityWeights: { common: 40, rare: 35, epic: 20, legendary: 5 },
        bonusType: 'Firewall Shield',
      },
      powerups: {
        types: ['shield', 'speed', 'multiplier'],
        effects: {
          shield: 'Firewall Active - Block one attack',
          speed: 'DDoS Counter - Rapid fire mode',
          multiplier: 'Network Effect - Double points',
        },
      },
    },
    hiddenLessons: [
      'Each invader wave = potential 51% attack',
      'Your ship = validator node protecting the network',
      'Shooting = verifying and rejecting bad transactions',
    ],
    achievements: [
      { id: 'wave_clear', name: 'Block Validated', description: 'Clear a wave without losing a life', trigger: 'wave_no_hit', bqoReward: 10 },
      { id: 'combo_master', name: 'Hash Power', description: 'Get a 10x combo', trigger: 'combo_10', bqoReward: 20 },
      { id: 'defender', name: 'Network Guardian', description: 'Reach wave 10', trigger: 'wave_10', bqoReward: 30 },
    ],
    themeColors: { primary: COLORS.neonPink, secondary: COLORS.neonCyan, accent: '#FF00FF' },
  },
  
  {
    gameId: 'token-tumble',
    concept: 'Digital Scarcity',
    conceptDescription: 'Stack unique blocks - each piece is one-of-a-kind like NFTs!',
    collectibles: {
      bqoTokens: {
        count: 4,
        spawnPattern: 'timed',
        pointsEach: 40,
        specialVariant: 'Minted Token',
      },
      nftGems: {
        count: 4,
        rarityWeights: { common: 35, rare: 35, epic: 25, legendary: 5 },
        bonusType: 'Line Clear Bonus',
      },
      powerups: {
        types: ['speed', 'magnet'],
        effects: {
          speed: 'Slow Mint - Pieces fall slower',
          magnet: 'Auto-Place - Piece finds best spot',
        },
      },
    },
    hiddenLessons: [
      'Each piece shape = different token type',
      'Clearing lines = burning tokens (reducing supply)',
      'Full board = failed mint (supply overflow)',
    ],
    achievements: [
      { id: 'tetris', name: 'Perfect Mint', description: 'Clear 4 lines at once', trigger: 'four_lines', bqoReward: 25 },
      { id: 'stack_master', name: 'Collection Complete', description: 'Score 5000 points', trigger: 'score_5000', bqoReward: 20 },
      { id: 'survivor', name: 'Diamond Hands', description: 'Survive 5 minutes', trigger: 'time_5min', bqoReward: 15 },
    ],
    themeColors: { primary: COLORS.neonCyan, secondary: COLORS.neonPink, accent: '#00FFFF' },
  },
  
  {
    gameId: 'hash-hopper',
    concept: 'Hash Functions',
    conceptDescription: 'One wrong hop changes everything - just like hash inputs!',
    collectibles: {
      bqoTokens: {
        count: 6,
        spawnPattern: 'path',
        pointsEach: 35,
        specialVariant: 'Hash Fragment',
      },
      nftGems: {
        count: 2,
        rarityWeights: { common: 45, rare: 30, epic: 20, legendary: 5 },
        bonusType: 'Safe Lane Preview',
      },
      powerups: {
        types: ['shield', 'speed'],
        effects: {
          shield: 'Checksum Valid - Survive one hit',
          speed: 'Quick Hash - Move faster',
        },
      },
    },
    hiddenLessons: [
      'Each lane = different input data',
      'Reaching goal = successful hash verification',
      'Cars/logs = data corruption attempts',
    ],
    achievements: [
      { id: 'no_death', name: 'Perfect Hash', description: 'Cross without dying', trigger: 'no_deaths', bqoReward: 20 },
      { id: 'speed_run', name: 'Fast Verification', description: 'Complete in under 30 seconds', trigger: 'time_30s', bqoReward: 25 },
      { id: 'collector', name: 'Data Miner', description: 'Collect all tokens in one run', trigger: 'all_tokens', bqoReward: 30 },
    ],
    themeColors: { primary: COLORS.success, secondary: COLORS.neonCyan, accent: '#32CD32' },
  },
  
  {
    gameId: 'seed-sprint',
    concept: 'Seed Phrases',
    conceptDescription: 'Collect and remember your 12 words - they unlock everything!',
    collectibles: {
      bqoTokens: {
        count: 12,
        spawnPattern: 'path',
        pointsEach: 25,
        specialVariant: 'Seed Word',
      },
      nftGems: {
        count: 3,
        rarityWeights: { common: 30, rare: 40, epic: 25, legendary: 5 },
        bonusType: 'Word Hint',
      },
      powerups: {
        types: ['shield', 'speed', 'multiplier'],
        effects: {
          shield: 'Backup Complete - Extra life',
          speed: 'Phrase Boost - Run faster',
          multiplier: 'Memory Aid - See words longer',
        },
      },
    },
    hiddenLessons: [
      'Each word = part of your private key',
      'Order matters - wrong order = wrong wallet',
      'Obstacles = phishing attempts stealing your phrase',
    ],
    achievements: [
      { id: 'perfect_recall', name: 'Perfect Memory', description: 'Recall all 12 words correctly', trigger: 'all_words', bqoReward: 50 },
      { id: 'no_stumble', name: 'Secure Storage', description: 'Complete without hitting obstacles', trigger: 'no_hits', bqoReward: 25 },
      { id: 'fast_phrase', name: 'Quick Backup', description: 'Complete in under 60 seconds', trigger: 'time_60s', bqoReward: 20 },
    ],
    themeColors: { primary: COLORS.error, secondary: COLORS.neonYellow, accent: '#FF6347' },
  },
  
  {
    gameId: 'crypto-climber',
    concept: 'NFT Collecting',
    conceptDescription: 'Climb to collect unique treasures - each egg is one-of-a-kind!',
    collectibles: {
      bqoTokens: {
        count: 7,
        spawnPattern: 'hidden',
        pointsEach: 45,
        specialVariant: 'Rare Egg',
      },
      nftGems: {
        count: 5,
        rarityWeights: { common: 25, rare: 35, epic: 30, legendary: 10 },
        bonusType: 'Trait Reveal',
      },
      powerups: {
        types: ['shield', 'speed', 'magnet'],
        effects: {
          shield: 'Barrel Proof - Immune to barrels',
          speed: 'Ladder Sprint - Climb faster',
          magnet: 'Collector Aura - Eggs come to you',
        },
      },
    },
    hiddenLessons: [
      'Each egg color = different rarity trait',
      'Higher platforms = rarer NFTs',
      'Barrels = gas fees slowing you down',
    ],
    achievements: [
      { id: 'top_floor', name: 'Floor Sweeper', description: 'Reach the top platform', trigger: 'reach_top', bqoReward: 30 },
      { id: 'rare_collector', name: 'Rare Hunter', description: 'Collect a legendary egg', trigger: 'legendary_egg', bqoReward: 40 },
      { id: 'speed_climb', name: 'Gas Optimizer', description: 'Complete in under 45 seconds', trigger: 'time_45s', bqoReward: 20 },
    ],
    themeColors: { primary: '#8B4513', secondary: COLORS.neonYellow, accent: '#FFD700' },
  },
  
  {
    gameId: 'stake-smash',
    concept: 'Staking Rewards',
    conceptDescription: 'Smash crystals to earn power - the longer you hold, the more you gain!',
    collectibles: {
      bqoTokens: {
        count: 10,
        spawnPattern: 'timed',
        pointsEach: 20,
        specialVariant: 'Staking Reward',
      },
      nftGems: {
        count: 3,
        rarityWeights: { common: 40, rare: 30, epic: 25, legendary: 5 },
        bonusType: 'Power Multiplier',
      },
      powerups: {
        types: ['speed', 'multiplier', 'magnet'],
        effects: {
          speed: 'Fast Paddle - Move faster',
          multiplier: 'APY Boost - Double rewards',
          magnet: 'Ball Magnet - Catches ball',
        },
      },
    },
    hiddenLessons: [
      'Colored bricks = different staking tiers',
      'Ball = your staked tokens working',
      'Combo chains = compound interest',
    ],
    achievements: [
      { id: 'clear_board', name: 'Unstake Complete', description: 'Clear all bricks', trigger: 'all_bricks', bqoReward: 25 },
      { id: 'no_drop', name: 'Diamond Stake', description: 'Never drop the ball', trigger: 'no_drops', bqoReward: 35 },
      { id: 'combo_king', name: 'Compound Master', description: 'Get 20 hits without dropping', trigger: 'combo_20', bqoReward: 20 },
    ],
    themeColors: { primary: COLORS.neonPink, secondary: COLORS.neonYellow, accent: '#FF4500' },
  },
  
  {
    gameId: 'ledger-leap',
    concept: 'Distributed Ledger',
    conceptDescription: 'Every platform records your jump - nothing is forgotten!',
    collectibles: {
      bqoTokens: {
        count: 8,
        spawnPattern: 'path',
        pointsEach: 30,
        specialVariant: 'Ledger Entry',
      },
      nftGems: {
        count: 3,
        rarityWeights: { common: 35, rare: 35, epic: 25, legendary: 5 },
        bonusType: 'Double Jump',
      },
      powerups: {
        types: ['shield', 'speed', 'multiplier'],
        effects: {
          shield: 'Backup Node - Extra life',
          speed: 'Block Time Boost - Move faster',
          multiplier: 'Sync Bonus - Double coins',
        },
      },
    },
    hiddenLessons: [
      'Each platform = a node in the network',
      'Coins = transaction records',
      'Enemies = invalid transaction attempts',
    ],
    achievements: [
      { id: 'distance', name: 'Long Ledger', description: 'Travel 1000 units', trigger: 'distance_1000', bqoReward: 20 },
      { id: 'coin_master', name: 'Full Sync', description: 'Collect 100 coins in one run', trigger: 'coins_100', bqoReward: 30 },
      { id: 'no_fall', name: 'Uptime 100%', description: 'Complete without falling', trigger: 'no_deaths', bqoReward: 35 },
    ],
    themeColors: { primary: COLORS.success, secondary: COLORS.neonCyan, accent: '#32CD32' },
  },
  
  {
    gameId: 'dao-duel',
    concept: 'Governance & Voting',
    conceptDescription: 'Vote on power-ups to win - democracy in action!',
    collectibles: {
      bqoTokens: {
        count: 6,
        spawnPattern: 'timed',
        pointsEach: 35,
        specialVariant: 'Voting Token',
      },
      nftGems: {
        count: 2,
        rarityWeights: { common: 40, rare: 35, epic: 20, legendary: 5 },
        bonusType: 'Veto Power',
      },
      powerups: {
        types: ['speed', 'shield', 'multiplier'],
        effects: {
          speed: 'Fast Vote - Paddle speeds up',
          shield: 'Proposal Shield - Block one goal',
          multiplier: 'Quorum Bonus - Points doubled',
        },
      },
    },
    hiddenLessons: [
      'Each point = voting power accumulated',
      'Power-up votes = governance proposals',
      'Winning = successful proposal execution',
    ],
    achievements: [
      { id: 'landslide', name: 'Landslide Victory', description: 'Win 11-0', trigger: 'score_11_0', bqoReward: 40 },
      { id: 'comeback', name: 'Proposal Reversal', description: 'Win after being down 5 points', trigger: 'comeback_5', bqoReward: 35 },
      { id: 'voter', name: 'Active Voter', description: 'Use all power-up types', trigger: 'all_powerups', bqoReward: 15 },
    ],
    themeColors: { primary: COLORS.chainGold, secondary: COLORS.neonPink, accent: '#FFD700' },
  },
  
  {
    gameId: 'mine-blaster',
    concept: 'Mining & Rewards',
    conceptDescription: 'Blast asteroids to mine rewards - proof of work in space!',
    collectibles: {
      bqoTokens: {
        count: 15,
        spawnPattern: 'hidden',
        pointsEach: 15,
        specialVariant: 'Ore Fragment',
      },
      nftGems: {
        count: 2,
        rarityWeights: { common: 50, rare: 30, epic: 15, legendary: 5 },
        bonusType: 'Mining Boost',
      },
      powerups: {
        types: ['shield', 'speed', 'multiplier'],
        effects: {
          shield: 'Force Field - Survive collision',
          speed: 'Thruster Boost - Faster movement',
          multiplier: 'Halving Event - Double ore value',
        },
      },
    },
    hiddenLessons: [
      'Big asteroids = block rewards to mine',
      'Small fragments = transaction fees',
      'Your ship = mining rig/hardware',
    ],
    achievements: [
      { id: 'miner', name: 'Solo Miner', description: 'Destroy 50 asteroids', trigger: 'destroy_50', bqoReward: 20 },
      { id: 'survivor', name: 'HODL Ship', description: 'Survive 3 minutes', trigger: 'time_3min', bqoReward: 25 },
      { id: 'collector', name: 'Block Reward', description: 'Collect all ore from one asteroid', trigger: 'full_collect', bqoReward: 15 },
    ],
    themeColors: { primary: COLORS.chainGold, secondary: COLORS.neonCyan, accent: '#FFD700' },
  },
  
  {
    gameId: 'lightning-dash',
    concept: 'Layer 2 Speed',
    conceptDescription: 'Side-channel boosts for instant speed - like Lightning Network!',
    collectibles: {
      bqoTokens: {
        count: 20,
        spawnPattern: 'path',
        pointsEach: 10,
        specialVariant: 'Lightning Bolt',
      },
      nftGems: {
        count: 3,
        rarityWeights: { common: 30, rare: 40, epic: 25, legendary: 5 },
        bonusType: 'Channel Capacity',
      },
      powerups: {
        types: ['speed', 'shield', 'magnet'],
        effects: {
          speed: 'Channel Open - Instant boost',
          shield: 'Payment Guard - Survive crash',
          magnet: 'Auto-Route - Collect nearby coins',
        },
      },
    },
    hiddenLessons: [
      'Lane switches = payment channel routing',
      'Boost meter = channel capacity',
      'Obstacles = congested main chain',
    ],
    achievements: [
      { id: 'speed_demon', name: 'Instant Settlement', description: 'Use boost 10 times', trigger: 'boost_10', bqoReward: 15 },
      { id: 'distance', name: 'Network Growth', description: 'Travel 5000 meters', trigger: 'distance_5000', bqoReward: 30 },
      { id: 'no_crash', name: 'Clean Routing', description: 'Complete without crashing', trigger: 'no_crash', bqoReward: 40 },
    ],
    themeColors: { primary: COLORS.neonYellow, secondary: COLORS.neonCyan, accent: '#FFFF00' },
  },
  
  {
    gameId: 'bridge-bouncer',
    concept: 'Cross-Chain Bridges',
    conceptDescription: 'Hop tiles to bridge between chains - connecting networks!',
    collectibles: {
      bqoTokens: {
        count: 8,
        spawnPattern: 'path',
        pointsEach: 40,
        specialVariant: 'Bridge Token',
      },
      nftGems: {
        count: 4,
        rarityWeights: { common: 25, rare: 40, epic: 30, legendary: 5 },
        bonusType: 'Fast Bridge',
      },
      powerups: {
        types: ['shield', 'speed'],
        effects: {
          shield: 'Atomic Swap - Safe from enemies',
          speed: 'Fast Finality - Jump faster',
        },
      },
    },
    hiddenLessons: [
      'Each tile color = different blockchain',
      'Converting colors = bridging assets',
      'Enemies = bridge exploits/hackers',
    ],
    achievements: [
      { id: 'full_bridge', name: 'Bridge Complete', description: 'Convert all tiles', trigger: 'all_tiles', bqoReward: 35 },
      { id: 'fast_bridge', name: 'Instant Bridge', description: 'Complete in under 60 seconds', trigger: 'time_60s', bqoReward: 25 },
      { id: 'safe_crossing', name: 'Secure Transfer', description: 'Complete without getting hit', trigger: 'no_hits', bqoReward: 30 },
    ],
    themeColors: { primary: COLORS.neonCyan, secondary: COLORS.neonPink, accent: '#00BFFF' },
  },
];

// Helper to get mechanics for a specific game
export const getGameMechanics = (gameId: string): GameBlockchainMechanics | undefined => {
  return GAME_MECHANICS.find(m => m.gameId === gameId);
};

// Get educational tip for game
export const getRandomTip = (gameId: string): string => {
  const mechanics = getGameMechanics(gameId);
  if (!mechanics) return 'Collect BQO tokens to earn rewards!';
  
  const tips = mechanics.hiddenLessons;
  return tips[Math.floor(Math.random() * tips.length)];
};

// Calculate BQO reward based on score
export const calculateBQOReward = (gameId: string, score: number): number => {
  const mechanics = getGameMechanics(gameId);
  if (!mechanics) return Math.floor(score / 100);
  
  // Base rate: 111 XP = 1 BQO
  const baseReward = Math.floor(score / 111);
  
  // Bonus for achievements
  let achievementBonus = 0;
  mechanics.achievements.forEach(achievement => {
    // Add achievement bonus if triggered (would check actual state)
    achievementBonus += achievement.bqoReward;
  });
  
  return baseReward;
};

export default GAME_MECHANICS;
