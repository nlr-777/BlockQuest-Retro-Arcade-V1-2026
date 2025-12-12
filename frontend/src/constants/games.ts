// Block Quest Official - Game Definitions

export interface GameConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  web3Concept: string;
  icon: string;
  color: string;
  accentColor: string;
  isPlayable: boolean;
  route: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bgm: string;
}

export const GAMES: GameConfig[] = [
  // Playable Games (5)
  {
    id: 'block-muncher',
    title: 'Block Muncher',
    subtitle: 'Pac-Man Style',
    description: 'Gobble blocks to build an unbreakable chain trail. Ghosts attack your trail!',
    web3Concept: 'Blockchain Basics',
    icon: '👾',
    color: '#FFD700',
    accentColor: '#FFA500',
    isPlayable: true,
    route: '/games/block-muncher',
    difficulty: 'Easy',
    bgm: 'chain_rain'
  },
  {
    id: 'token-tumble',
    title: 'Block Tumble',
    subtitle: 'Tetris Style',
    description: 'Rotate and stack blocks. Clear lines to grow your collection!',
    web3Concept: 'Digital Collections',
    icon: '🧱',
    color: '#00CED1',
    accentColor: '#20B2AA',
    isPlayable: true,
    route: '/games/token-tumble',
    difficulty: 'Medium',
    bgm: 'proof_of_work'
  },
  {
    id: 'chain-invaders',
    title: 'Chain Invaders',
    subtitle: 'Space Invaders Style',
    description: 'Defend your chain from alien invaders! Vote power-ups fire lasers.',
    web3Concept: 'Consensus Mechanism',
    icon: '👽',
    color: '#9400D3',
    accentColor: '#8B008B',
    isPlayable: true,
    route: '/games/chain-invaders',
    difficulty: 'Medium',
    bgm: 'dao_vote'
  },
  {
    id: 'hash-hopper',
    title: 'Hash Hopper',
    subtitle: 'Frogger Style',
    description: 'Hop across platforms. Tiny path changes scramble the hash code!',
    web3Concept: 'Hash Functions',
    icon: '🐸',
    color: '#32CD32',
    accentColor: '#228B22',
    isPlayable: true,
    route: '/games/hash-hopper',
    difficulty: 'Hard',
    bgm: 'hash_hopper'
  },
  {
    id: 'seed-sprint',
    title: 'Seed Sprint',
    subtitle: 'Endless Runner',
    description: 'Hurdle obstacles and collect seed words. Recall all 12 at checkpoints!',
    web3Concept: 'Seed Phrases',
    icon: '🏃',
    color: '#FF6347',
    accentColor: '#DC143C',
    isPlayable: true,
    route: '/games/seed-sprint',
    difficulty: 'Hard',
    bgm: 'seed_sprint'
  },
  // Coming Soon Games (10)
  {
    id: 'crypto-climber',
    title: 'Treasure Climber',
    subtitle: 'Donkey Kong Style',
    description: 'Climb for unique-trait eggs. Trade for upgrades!',
    web3Concept: 'Unique Collectibles',
    icon: '🦍',
    color: '#8B4513',
    accentColor: '#A0522D',
    isPlayable: true,
    route: '/games/crypto-climber',
    difficulty: 'Medium',
    bgm: 'nft_flip'
  },
  {
    id: 'stake-smash',
    title: 'Power Smash',
    subtitle: 'Breakout Style',
    description: 'Smash power crystals to charge up! Higher tier = more power!',
    web3Concept: 'Resource Building',
    icon: '⚡',
    color: '#FF4500',
    accentColor: '#FF6600',
    isPlayable: true,
    route: '/games/stake-smash',
    difficulty: 'Medium',
    bgm: 'proof_of_work'
  },
  {
    id: 'ledger-leap',
    title: 'Ledger Leap',
    subtitle: 'Mario Style',
    description: 'Stomp blocks to extend your ledger trail!',
    web3Concept: 'Distributed Ledger',
    icon: '📒',
    color: '#4169E1',
    accentColor: '#6495ED',
    isPlayable: false,
    route: '/games/coming-soon/ledger-leap',
    difficulty: 'Easy',
    bgm: 'ledger_scan'
  },
  {
    id: 'dao-duel',
    title: 'DAO Duel',
    subtitle: 'Pong Style',
    description: 'Vote on paddle upgrades mid-rally!',
    web3Concept: 'DAO Governance',
    icon: '🗳️',
    color: '#FF69B4',
    accentColor: '#FF1493',
    isPlayable: false,
    route: '/games/coming-soon/dao-duel',
    difficulty: 'Easy',
    bgm: 'dao_vote'
  },
  {
    id: 'mine-blaster',
    title: 'Rock Blaster',
    subtitle: 'Asteroids Style',
    description: 'Blast rocks in space. Bigger ship = more power!',
    web3Concept: 'Resource Gathering',
    icon: '⛏️',
    color: '#FFD700',
    accentColor: '#DAA520',
    isPlayable: false,
    route: '/games/coming-soon/mine-blaster',
    difficulty: 'Hard',
    bgm: 'proof_of_work'
  },
  {
    id: 'lightning-dash',
    title: 'Lightning Dash',
    subtitle: 'Racer Style',
    description: 'Side-channel nitro for instant overtakes!',
    web3Concept: 'Layer 2',
    icon: '⚡',
    color: '#FFFF00',
    accentColor: '#FFA500',
    isPlayable: false,
    route: '/games/coming-soon/lightning-dash',
    difficulty: 'Medium',
    bgm: 'lightning_zap'
  },
  {
    id: 'bridge-bouncer',
    title: 'Bridge Bouncer',
    subtitle: 'Q*Bert Style',
    description: 'Hop to bridge chains and convert traits!',
    web3Concept: 'Cross-Chain Bridges',
    icon: '🌉',
    color: '#00BFFF',
    accentColor: '#1E90FF',
    isPlayable: false,
    route: '/games/coming-soon/bridge-bouncer',
    difficulty: 'Hard',
    bgm: 'bridge_bounce'
  },
  {
    id: 'ipfs-pinball',
    title: 'IPFS Pinball',
    subtitle: 'Pinball Style',
    description: 'Pin art bumpers for eternal bounces!',
    web3Concept: 'Decentralized Storage',
    icon: '🎯',
    color: '#9932CC',
    accentColor: '#8A2BE2',
    isPlayable: false,
    route: '/games/coming-soon/ipfs-pinball',
    difficulty: 'Medium',
    bgm: 'eternal_orbit'
  },
  {
    id: 'contract-crusher',
    title: 'Contract Crusher',
    subtitle: 'Arkanoid Style',
    description: 'Match if-then orbs for special powers!',
    web3Concept: 'Smart Contracts',
    icon: '📜',
    color: '#FF7F50',
    accentColor: '#FF6347',
    isPlayable: false,
    route: '/games/coming-soon/contract-crusher',
    difficulty: 'Hard',
    bgm: 'contract_gear'
  },
  {
    id: 'quest-vault',
    title: 'Quest Vault',
    subtitle: 'Gauntlet Style',
    description: 'Co-op dungeon! Mine, vote, and custody loot together.',
    web3Concept: 'Multi-Sig',
    icon: '🏰',
    color: '#B22222',
    accentColor: '#8B0000',
    isPlayable: false,
    route: '/games/coming-soon/quest-vault',
    difficulty: 'Hard',
    bgm: 'quest_vault'
  }
];

export const PLAYABLE_GAMES = GAMES.filter(g => g.isPlayable);
export const COMING_SOON_GAMES = GAMES.filter(g => !g.isPlayable);
