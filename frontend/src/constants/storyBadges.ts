// BlockQuest Official - Story Badges & Quizzes
// Uniquely rare badge achievements linked to mini quizzes from the book series

export interface StoryBadge {
  id: string;
  title: string;
  description: string;
  bookNumber: number;
  imageUrl: string;
  rarity: 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  xpReward: number;
  quiz: Quiz;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  hint?: string;
}

// Story Badge Images from the Book Series
export const STORY_BADGE_IMAGES = {
  digitalIdentity: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/oyk4lzo6_generated_image_20260128_052346_1.png',
  founderNfts: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/vmezbnvn_generated_image_20260128_052124_1.png',
  blockchainOwnership: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/x72avvnr_generated_image_20260128_052106_1.png',
  arcadeAdventure: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/5y7dpigz_generated_image_20260128_052005_1.png',
  questTokenomics: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/dk4d08wv_generated_image_20260128_052024_1.png',
};

// Story Badges with Mini Quizzes
export const STORY_BADGES: StoryBadge[] = [
  {
    id: 'digital-identity-master',
    title: 'Digital Identity Master',
    description: 'Understand the difference between centralized and decentralized identity',
    bookNumber: 1,
    imageUrl: STORY_BADGE_IMAGES.digitalIdentity,
    rarity: 'Epic',
    xpReward: 250,
    quiz: {
      question: 'What is the main difference between centralized and decentralized identity?',
      options: [
        'Centralized identity is faster to use',
        'Decentralized identity gives YOU control over your data',
        'There is no difference between them',
        'Centralized identity is more secure'
      ],
      correctAnswer: 1,
      explanation: 'Decentralized identity (like blockchain wallets) puts YOU in control of your personal data, unlike centralized systems where companies control your information.',
      hint: 'Think about who holds the "keys" to your identity...'
    }
  },
  {
    id: 'founder-nft-collector',
    title: 'Founder NFT Collector',
    description: 'Learn about the exclusive Founder NFT badges and their special powers',
    bookNumber: 4,
    imageUrl: STORY_BADGE_IMAGES.founderNfts,
    rarity: 'Legendary',
    xpReward: 500,
    quiz: {
      question: 'What makes a Founder NFT special in the Quest Coins universe?',
      options: [
        'It costs the most money',
        'It has the prettiest colors',
        'It grants special access, voting power, and proves you were an early supporter',
        'It can be copied infinitely'
      ],
      correctAnswer: 2,
      explanation: 'Founder NFTs are special because they prove you were an early supporter and grant exclusive access, voting rights, and benefits that can never be replicated!',
      hint: 'Early supporters are rewarded in Web3...'
    }
  },
  {
    id: 'blockchain-ownership-guru',
    title: 'Blockchain Ownership Guru',
    description: 'Master the concept of true digital ownership recorded on the blockchain',
    bookNumber: 2,
    imageUrl: STORY_BADGE_IMAGES.blockchainOwnership,
    rarity: 'Epic',
    xpReward: 300,
    quiz: {
      question: 'Why is ownership on a blockchain different from owning something in a regular game?',
      options: [
        'Blockchain items are always more expensive',
        'Your ownership is recorded permanently and cannot be taken away by anyone',
        'Blockchain items look better',
        'There is no real difference'
      ],
      correctAnswer: 1,
      explanation: 'When you own something on a blockchain, your ownership is recorded forever in a way that no company, hacker, or anyone else can change or take away!',
      hint: 'The blockchain is like an permanent, unchangeable record book...'
    }
  },
  {
    id: 'arcade-adventurer',
    title: 'Arcade Adventurer',
    description: "Join Zara's adventure through the magical arcade",
    bookNumber: 3,
    imageUrl: STORY_BADGE_IMAGES.arcadeAdventure,
    rarity: 'Rare',
    xpReward: 150,
    quiz: {
      question: "In Zara's Arcade Adventure, what did she discover about Quest Coins?",
      options: [
        'They are just regular game tokens',
        'They can be traded for real rewards and represent real value',
        'They can only be used once',
        'They only work in one game'
      ],
      correctAnswer: 1,
      explanation: 'Quest Coins are utility tokens that can be earned through gameplay and exchanged for real rewards, merchandise, and special access - they have real value!',
      hint: 'Quest Coins bridge gaming and real-world rewards...'
    }
  },
  {
    id: 'tokenomics-wizard',
    title: 'Tokenomics Wizard',
    description: 'Understand how Quest Coins tokenomics work',
    bookNumber: 5,
    imageUrl: STORY_BADGE_IMAGES.questTokenomics,
    rarity: 'Mythic',
    xpReward: 750,
    quiz: {
      question: 'What is "tokenomics" and why does it matter for Quest Coins?',
      options: [
        'It\'s just a fancy word for money',
        'It\'s the study of how tokens are created, distributed, and maintain their value',
        'It\'s a type of cryptocurrency exchange',
        'It only matters for adults'
      ],
      correctAnswer: 1,
      explanation: 'Tokenomics is the science of how tokens work - how many exist, how they\'re earned and spent, and what keeps them valuable. Good tokenomics means Quest Coins stay valuable and useful!',
      hint: 'Think of it like the rules that govern a game\'s economy...'
    }
  }
];

// Get badge by ID
export const getStoryBadgeById = (id: string): StoryBadge | undefined => {
  return STORY_BADGES.find(badge => badge.id === id);
};

// Get badges by book number
export const getStoryBadgesByBook = (bookNumber: number): StoryBadge[] => {
  return STORY_BADGES.filter(badge => badge.bookNumber === bookNumber);
};

// Rarity colors
export const RARITY_COLORS = {
  Rare: '#3B82F6',
  Epic: '#8B5CF6',
  Legendary: '#F59E0B',
  Mythic: '#FF00FF',
};
