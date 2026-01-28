// BlockQuest Official - Game-to-Story Mapping
// Maps each of the 15 games to Web3 Chaos Chronicles book chapters

export interface StoryMapping {
  gameId: string;
  bookNumber: number;
  bookTitle: string;
  chapterTitle: string;
  storyMoment: string;
  conceptTaught: string;
  characterFocus: string; // Primary character for this game
  bonusCharacters: string[]; // Characters that get bonus on this game
  dialogueOnLoad: {
    character: string;
    line: string;
  };
  visualTheme: string;
  funFact: string; // Kid-friendly explanation
}

// Book structure:
// Book 1: Money's Origin Story (Blocks, Chain, Hash) - FOUNDATIONAL
// Book 2: Why Blockchains Exist (Ledger, Seed, Power/Mining) - TRUST & SECURITY
// Book 3: Tokens (Treasure/Arcade, Contract, Quest Coins) - TOKEN ECONOMY  
// Book 4: NFTs (IPFS/Library, Bridge, Rock/Screenshot) - DIGITAL OWNERSHIP
// Book 5: Web3 Games & Future (DAO, Lightning, Final Mission) - ADVANCED

export const STORY_MAPPINGS: StoryMapping[] = [
  // ===== BOOK 1: MONEY'S ORIGIN STORY =====
  {
    gameId: 'block-muncher',
    bookNumber: 1,
    bookTitle: "Money's Origin Story",
    chapterTitle: 'What Is a Block?',
    storyMoment: 'When the gang first learns what a block contains (data, timestamp, hash)',
    conceptTaught: 'Blockchain blocks - containers of information',
    characterFocus: 'zara',
    bonusCharacters: ['zara', 'sam'],
    dialogueOnLoad: {
      character: 'zara',
      line: "Every block is like a page in an unchangeable diary. Let's fill some pages!",
    },
    visualTheme: 'digital_blocks',
    funFact: 'A block is like a box that holds information. Once sealed, nobody can change it!',
  },
  {
    gameId: 'chain-invaders',
    bookNumber: 1,
    bookTitle: "Money's Origin Story",
    chapterTitle: 'Linking Blocks Together',
    storyMoment: "Zara shows how blocks connect into an unbreakable chain",
    conceptTaught: 'Blockchain chains - linked blocks that protect each other',
    characterFocus: 'zara',
    bonusCharacters: ['zara', 'lila'],
    dialogueOnLoad: {
      character: 'zara',
      line: "Each block holds hands with the next. Break one, and you break the chain!",
    },
    visualTheme: 'chain_links',
    funFact: 'Blocks link together like a friendship bracelet. The chain gets stronger with each new block!',
  },
  {
    gameId: 'hash-hopper',
    bookNumber: 1,
    bookTitle: "Money's Origin Story",
    chapterTitle: 'The Magic Fingerprint',
    storyMoment: 'Sam discovers how tiny changes create completely different hashes',
    conceptTaught: 'Hash functions - unique digital fingerprints',
    characterFocus: 'sam',
    bonusCharacters: ['sam', 'miko'],
    dialogueOnLoad: {
      character: 'sam',
      line: "Change one tiny thing and the whole fingerprint scrambles. That's how we catch cheaters!",
    },
    visualTheme: 'fingerprint_digital',
    funFact: 'A hash is like a magic fingerprint. Even changing one letter creates a totally different code!',
  },

  // ===== BOOK 2: WHY BLOCKCHAINS EXIST =====
  {
    gameId: 'ledger-leap',
    bookNumber: 2,
    bookTitle: 'Why Blockchains Exist',
    chapterTitle: 'The Shared Notebook',
    storyMoment: "The gang realizes everyone can have the same notebook copy",
    conceptTaught: 'Distributed ledgers - shared record books',
    characterFocus: 'lila',
    bonusCharacters: ['lila', 'sam'],
    dialogueOnLoad: {
      character: 'lila',
      line: "Imagine if EVERYONE had the same notebook. Nobody could secretly change the answers!",
    },
    visualTheme: 'shared_notebooks',
    funFact: 'A ledger is like a notebook that everyone in class has a copy of. No one can cheat!',
  },
  {
    gameId: 'seed-sprint',
    bookNumber: 2,
    bookTitle: 'Why Blockchains Exist',
    chapterTitle: 'The Secret Recovery Words',
    storyMoment: 'Ollie almost loses access and learns why seed phrases matter',
    conceptTaught: 'Seed phrases - secret recovery words',
    characterFocus: 'ollie',
    bonusCharacters: ['ollie', 'sam'],
    dialogueOnLoad: {
      character: 'ollie',
      line: "12 secret words = your digital key. Memorize them, protect them, NEVER share them!",
    },
    visualTheme: 'secret_words',
    funFact: 'Seed words are like a secret password only you know. They unlock your digital treasure!',
  },
  {
    gameId: 'mine-blaster',
    bookNumber: 2,
    bookTitle: 'Why Blockchains Exist',
    chapterTitle: 'The Puzzle Solvers',
    storyMoment: 'The gang watches computers race to solve puzzles for rewards',
    conceptTaught: 'Mining/Proof of Work - earning rewards by solving puzzles',
    characterFocus: 'ollie',
    bonusCharacters: ['ollie', 'zara'],
    dialogueOnLoad: {
      character: 'ollie',
      line: "Computers race to solve puzzles. First one to finish gets the reward! Let's GO!",
    },
    visualTheme: 'space_mining',
    funFact: 'Mining is like a puzzle race. Computers compete to solve it first and win a prize!',
  },

  // ===== BOOK 3: TOKENS =====
  {
    gameId: 'crypto-climber',
    bookNumber: 3,
    bookTitle: 'Tokens',
    chapterTitle: 'Digital Treasures',
    storyMoment: 'Miko creates unique digital eggs with special traits',
    conceptTaught: 'Unique digital items with provable traits',
    characterFocus: 'miko',
    bonusCharacters: ['miko', 'zara'],
    dialogueOnLoad: {
      character: 'miko',
      line: "Each treasure has its own story and traits. No two are exactly alike!",
    },
    visualTheme: 'treasure_vault',
    funFact: 'Digital treasures can be unique, just like trading cards. Some are super rare!',
  },
  {
    gameId: 'contract-crusher',
    bookNumber: 3,
    bookTitle: 'Tokens',
    chapterTitle: 'The Vending Machine That Never Lies',
    storyMoment: 'Zara programs a vending machine that runs on rules, not trust',
    conceptTaught: 'Smart contracts - programs that run automatically',
    characterFocus: 'zara',
    bonusCharacters: ['zara', 'miko'],
    dialogueOnLoad: {
      character: 'miko',
      line: "We literally programmed trust. The machine CAN'T cheat us because code doesn't lie!",
    },
    visualTheme: 'vending_machine',
    funFact: 'Smart contracts are like vending machines. Put in the right coins, get your snack. No human needed!',
  },
  {
    gameId: 'quest-vault',
    bookNumber: 3,
    bookTitle: 'Tokens',
    chapterTitle: 'Quest Coins Are Born',
    storyMoment: 'The team launches their first token: Quest Coins',
    conceptTaught: 'Creating and using digital tokens',
    characterFocus: 'zara',
    bonusCharacters: ['zara', 'lila', 'miko'],
    dialogueOnLoad: {
      character: 'zara',
      line: "Our own digital coins! Earn them, spend them, but most importantly - have fun!",
    },
    visualTheme: 'coin_mint',
    funFact: 'Tokens are like arcade tickets. Earn them by playing and trade them for cool stuff!',
  },

  // ===== BOOK 4: DIGITAL OWNERSHIP =====
  {
    gameId: 'ipfs-pinball',
    bookNumber: 4,
    bookTitle: 'Digital Ownership',
    chapterTitle: 'The Library That Never Forgets',
    storyMoment: "Miko discovers files can live forever across many computers",
    conceptTaught: 'IPFS - storing files across many computers',
    characterFocus: 'miko',
    bonusCharacters: ['miko', 'lila'],
    dialogueOnLoad: {
      character: 'miko',
      line: "Pin your files to the network! The more copies, the safer your art!",
    },
    visualTheme: 'network_nodes',
    funFact: "IPFS is like having copies of your homework on everyone's computer. It can never get lost!",
  },
  {
    gameId: 'bridge-bouncer',
    bookNumber: 4,
    bookTitle: 'Digital Ownership',
    chapterTitle: 'Crossing Between Worlds',
    storyMoment: 'Sam learns how to safely move tokens between different chains',
    conceptTaught: 'Cross-chain bridges - moving between blockchains',
    characterFocus: 'sam',
    bonusCharacters: ['sam', 'zara'],
    dialogueOnLoad: {
      character: 'sam',
      line: "Different chains, different rules. Bridges let us hop between them safely!",
    },
    visualTheme: 'bridge_portal',
    funFact: 'Bridges connect different blockchains, like tunnels connecting different countries!',
  },
  {
    gameId: 'token-tumble',
    bookNumber: 4,
    bookTitle: 'Digital Ownership',
    chapterTitle: 'The Screenshot Paradox',
    storyMoment: "Ollie asks: 'But can't you just screenshot it?'",
    conceptTaught: 'Why ownership matters more than copies',
    characterFocus: 'ollie',
    bonusCharacters: ['ollie', 'miko'],
    dialogueOnLoad: {
      character: 'ollie',
      line: "Anyone can screenshot the Mona Lisa, but only one person OWNS it. That's the magic!",
    },
    visualTheme: 'digital_art',
    funFact: 'Owning something digital is like having the original painting, not just a poster!',
  },

  // ===== BOOK 5: WEB3 GAMES & FUTURE =====
  {
    gameId: 'dao-duel',
    bookNumber: 5,
    bookTitle: 'Web3 Games & Future',
    chapterTitle: 'The Club Where Everyone Votes',
    storyMoment: 'Lila organizes the first Quest Coins DAO vote',
    conceptTaught: 'DAOs - groups that decide things together',
    characterFocus: 'lila',
    bonusCharacters: ['lila', 'zara'],
    dialogueOnLoad: {
      character: 'lila',
      line: "No boss. No president. Just us voting together. This is how we make decisions!",
    },
    visualTheme: 'voting_hall',
    funFact: 'A DAO is like a club where everyone gets a vote. No single person is the boss!',
  },
  {
    gameId: 'lightning-dash',
    bookNumber: 5,
    bookTitle: 'Web3 Games & Future',
    chapterTitle: 'The Express Lane',
    storyMoment: 'The gang discovers faster, cheaper transactions through Layer 2',
    conceptTaught: 'Layer 2 solutions - faster side channels',
    characterFocus: 'ollie',
    bonusCharacters: ['ollie', 'zara'],
    dialogueOnLoad: {
      character: 'ollie',
      line: "Main road too slow? Take the express lane! Same destination, way faster!",
    },
    visualTheme: 'speed_lanes',
    funFact: 'Layer 2 is like a shortcut road. Same place, but way faster and cheaper!',
  },
  {
    gameId: 'stake-smash',
    bookNumber: 5,
    bookTitle: 'Web3 Games & Future',
    chapterTitle: 'The Power of Patience',
    storyMoment: 'The team learns how holding can grow their resources',
    conceptTaught: 'Staking/Building resources over time',
    characterFocus: 'lila',
    bonusCharacters: ['lila', 'sam'],
    dialogueOnLoad: {
      character: 'lila',
      line: "Lock up your power to help the network, and watch it grow! Patience pays off!",
    },
    visualTheme: 'power_crystals',
    funFact: 'Staking is like planting a seed. Leave it alone and watch it grow bigger!',
  },
];

// Helper functions
export const getStoryMappingByGameId = (gameId: string): StoryMapping | undefined => {
  return STORY_MAPPINGS.find(m => m.gameId === gameId);
};

export const getGamesByBook = (bookNumber: number): StoryMapping[] => {
  return STORY_MAPPINGS.filter(m => m.bookNumber === bookNumber);
};

export const getGamesByCharacter = (characterId: string): StoryMapping[] => {
  return STORY_MAPPINGS.filter(m => 
    m.characterFocus === characterId || m.bonusCharacters.includes(characterId)
  );
};

// Book titles for display
export const BOOK_TITLES: Record<number, { title: string; subtitle: string; icon: string }> = {
  1: { title: "Book 1", subtitle: "Money's Origin Story", icon: "📖" },
  2: { title: "Book 2", subtitle: "Why Blockchains Exist", icon: "🔐" },
  3: { title: "Book 3", subtitle: "Tokens", icon: "🪙" },
  4: { title: "Book 4", subtitle: "Digital Ownership", icon: "🎨" },
  5: { title: "Book 5", subtitle: "Web3 Games & Future", icon: "🚀" },
};

// Story chapters that can be unlocked
export interface StoryChapter {
  id: string;
  bookNumber: number;
  title: string;
  description: string;
  unlockCondition: string;
  gameIds: string[]; // Games that unlock parts of this chapter
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'chapter-0',
    bookNumber: 0,
    title: 'The Discovery',
    description: 'Five friends stumble upon something that will change everything...',
    unlockCondition: 'default',
    gameIds: [],
  },
  {
    id: 'chapter-1',
    bookNumber: 1,
    title: 'Building Blocks',
    description: 'Zara explains how information gets stored in unbreakable boxes.',
    unlockCondition: 'Complete any Book 1 game',
    gameIds: ['block-muncher', 'chain-invaders', 'hash-hopper'],
  },
  {
    id: 'chapter-2',
    bookNumber: 2,
    title: 'Trust No One (Except Code)',
    description: "Sam questions everything, and that's exactly what they need.",
    unlockCondition: 'Complete any Book 2 game',
    gameIds: ['ledger-leap', 'seed-sprint', 'mine-blaster'],
  },
  {
    id: 'chapter-3',
    bookNumber: 3,
    title: 'Creating Value',
    description: 'The gang creates their first digital token: Quest Coins.',
    unlockCondition: 'Complete any Book 3 game',
    gameIds: ['crypto-climber', 'contract-crusher', 'quest-vault'],
  },
  {
    id: 'chapter-4',
    bookNumber: 4,
    title: 'Own Your Art',
    description: "Miko's art finds a home that can never be taken away.",
    unlockCondition: 'Complete any Book 4 game',
    gameIds: ['ipfs-pinball', 'bridge-bouncer', 'token-tumble'],
  },
  {
    id: 'chapter-5',
    bookNumber: 5,
    title: 'The Future Is Ours',
    description: 'Together, they build something bigger than themselves.',
    unlockCondition: 'Complete any Book 5 game',
    gameIds: ['dao-duel', 'lightning-dash', 'stake-smash'],
  },
  {
    id: 'finale',
    bookNumber: 6,
    title: 'One Year Later',
    description: 'The Collective assembles. What started in a garage changed the world.',
    unlockCondition: 'Unlock all 5 main characters',
    gameIds: [],
  },
];

export const getChapterById = (chapterId: string): StoryChapter | undefined => {
  return STORY_CHAPTERS.find(c => c.id === chapterId);
};

export const getChaptersByBook = (bookNumber: number): StoryChapter[] => {
  return STORY_CHAPTERS.filter(c => c.bookNumber === bookNumber);
};
