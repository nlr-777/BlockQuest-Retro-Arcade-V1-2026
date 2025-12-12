// Block Quest Official - Game Definitions

export interface GameConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  instructions: string;
  controls: string;
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
  // Playable Games (12)
  {
    id: 'block-muncher',
    title: 'Block Muncher',
    subtitle: 'Pac-Man Style',
    description: 'Gobble blocks to build an unbreakable chain trail. Ghosts attack your trail!',
    instructions: 'Eat all the blocks to complete each level. Avoid ghosts or lose a life. Your chain trail shows your progress!',
    controls: '⬆️⬇️⬅️➡️ D-PAD to move',
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
    instructions: 'Stack falling blocks to create complete rows. Clear rows to score points. Don\'t let blocks reach the top!',
    controls: '⬅️➡️ Move | ⬆️ Rotate | ⬇️ Drop',
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
    instructions: 'Shoot the aliens before they reach the bottom. Collect votes to unlock power-ups. Survive all waves!',
    controls: '⬅️➡️ Move | 🔴 FIRE to shoot',
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
    instructions: 'Cross the road and river to reach the safe zones. Time your jumps carefully - one wrong move changes everything!',
    controls: '⬆️⬇️⬅️➡️ D-PAD to hop',
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
    instructions: 'Run and jump over obstacles. Collect seed words in order. Remember them - you\'ll need to recall at checkpoints!',
    controls: 'TAP to jump | HOLD for high jump',
    web3Concept: 'Seed Phrases',
    icon: '🏃',
    color: '#FF6347',
    accentColor: '#DC143C',
    isPlayable: true,
    route: '/games/seed-sprint',
    difficulty: 'Hard',
    bgm: 'seed_sprint'
  },
  {
    id: 'crypto-climber',
    title: 'Treasure Climber',
    subtitle: 'Donkey Kong Style',
    description: 'Climb for unique-trait eggs. Trade for upgrades!',
    instructions: 'Climb the ladders and platforms. Collect rare eggs while avoiding falling barrels. Each egg has unique traits!',
    controls: '⬅️➡️ Move | ⬆️ Climb | 🔴 JUMP',
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
    instructions: 'Bounce the ball to break bricks. Colored bricks give different power levels. Don\'t let the ball fall!',
    controls: '⬅️➡️ Move paddle | TAP to launch',
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
    description: 'Jump across platforms collecting data records!',
    instructions: 'Run and jump across platforms. Collect coins and data records. Avoid enemies and don\'t fall!',
    controls: '⬅️➡️ Move | 🔴 JUMP | HOLD for high jump',
    web3Concept: 'Record Keeping',
    icon: '📚',
    color: '#32CD32',
    accentColor: '#228B22',
    isPlayable: true,
    route: '/games/ledger-leap',
    difficulty: 'Medium',
    bgm: 'distributed_beat'
  },
  {
    id: 'dao-duel',
    title: 'DAO Duel',
    subtitle: 'Pong Style',
    description: 'Vote on power-ups to beat your opponent!',
    instructions: 'Move your paddle to hit the ball. Score 11 points to win. Use voting power for special abilities!',
    controls: '⬆️⬇️ Move paddle | 🔴 VOTE for power-ups',
    web3Concept: 'Team Voting',
    icon: '👑',
    color: '#FFD700',
    accentColor: '#DAA520',
    isPlayable: true,
    route: '/games/dao-duel',
    difficulty: 'Easy',
    bgm: 'governance_groove'
  },
  {
    id: 'mine-blaster',
    title: 'Rock Blaster',
    subtitle: 'Asteroids Style',
    description: 'Blast rocks in space. Bigger ship = more power!',
    instructions: 'Shoot asteroids to break them down. Collect resources. Avoid collisions!',
    controls: '⬅️➡️ Rotate | ⬆️ Thrust | 🔴 FIRE',
    web3Concept: 'Resource Gathering',
    icon: '⛏️',
    color: '#FFD700',
    accentColor: '#DAA520',
    isPlayable: true,
    route: '/games/mine-blaster',
    difficulty: 'Hard',
    bgm: 'proof_of_work'
  },
  {
    id: 'lightning-dash',
    title: 'Lightning Dash',
    subtitle: 'Racer Style',
    description: 'Side-channel nitro for instant overtakes!',
    instructions: 'Race through traffic at high speed. Collect bolts to charge boost. Dodge obstacles!',
    controls: '⬅️➡️ Change lanes | 🔴 BOOST when charged',
    web3Concept: 'Layer 2',
    icon: '⚡',
    color: '#FFFF00',
    accentColor: '#FFA500',
    isPlayable: true,
    route: '/games/lightning-dash',
    difficulty: 'Medium',
    bgm: 'lightning_zap'
  },
  {
    id: 'bridge-bouncer',
    title: 'Bridge Bouncer',
    subtitle: 'Q*Bert Style',
    description: 'Hop to bridge chains and convert traits!',
    instructions: 'Hop on tiles to change their colors. Bridge all tiles to the target chain. Avoid enemies!',
    controls: '↖️↗️↙️↘️ Diagonal hops only',
    web3Concept: 'Cross-Chain Bridges',
    icon: '🌉',
    color: '#00BFFF',
    accentColor: '#1E90FF',
    isPlayable: true,
    route: '/games/bridge-bouncer',
    difficulty: 'Hard',
    bgm: 'bridge_bounce'
  },
  {
    id: 'ipfs-pinball',
    title: 'IPFS Pinball',
    subtitle: 'Pinball Style',
    description: 'Pin art bumpers for eternal bounces!',
    instructions: 'Coming soon! Use flippers to keep the ball in play.',
    controls: '⬅️➡️ Flippers',
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
    instructions: 'Coming soon! Break blocks to execute contracts.',
    controls: '⬅️➡️ Move paddle',
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
    instructions: 'Coming soon! Team up to explore dungeons.',
    controls: 'D-PAD + Action',
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
