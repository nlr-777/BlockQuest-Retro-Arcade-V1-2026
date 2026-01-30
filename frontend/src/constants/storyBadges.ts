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

// Story Badges with Mini Quizzes - Web3 Chaos Chronicles Themed
export const STORY_BADGES: StoryBadge[] = [
  {
    id: 'digital-identity-master',
    title: 'Digital Identity Master',
    description: 'Master the concept of digital identity with Zara and friends',
    bookNumber: 1,
    imageUrl: STORY_BADGE_IMAGES.digitalIdentity,
    rarity: 'Epic',
    xpReward: 250,
    quiz: {
      question: 'In the Web3 Chaos Chronicles, why does Zara prefer her blockchain wallet over a regular account?',
      options: [
        'Because it has cooler graphics',
        'Because SHE controls her identity and data - no company can delete her account',
        'Because it costs less money',
        'Because her parents told her to use it'
      ],
      correctAnswer: 1,
      explanation: 'In the story, Zara discovers that with a blockchain wallet, she truly OWNS her digital identity. Unlike regular accounts that companies can ban or delete, her wallet belongs to her forever!',
      hint: 'Remember when Miko lost his game account? Zara\'s wallet is different...'
    }
  },
  {
    id: 'founder-nft-collector',
    title: 'Founder NFT Hero',
    description: 'Learn about the legendary Founder NFTs with the Quest Coins crew',
    bookNumber: 4,
    imageUrl: STORY_BADGE_IMAGES.founderNfts,
    rarity: 'Legendary',
    xpReward: 500,
    quiz: {
      question: 'In Book 4, what special power did Kai discover his Founder NFT badge gave him?',
      options: [
        'The ability to fly in the game',
        'Unlimited Quest Coins',
        'Voting rights in the DAO and proof he was an early supporter of the arcade',
        'Free pizza forever'
      ],
      correctAnswer: 2,
      explanation: 'Kai\'s Founder NFT proved he believed in the arcade from the beginning! It gave him voting power in the DAO to help decide the arcade\'s future, plus special perks only early supporters receive.',
      hint: 'Founder NFTs are about being part of the community\'s history...'
    }
  },
  {
    id: 'blockchain-ownership-guru',
    title: 'True Ownership Champion',
    description: 'Understand true digital ownership like Miko learned the hard way',
    bookNumber: 2,
    imageUrl: STORY_BADGE_IMAGES.blockchainOwnership,
    rarity: 'Epic',
    xpReward: 300,
    quiz: {
      question: 'What happened to Miko that taught him about blockchain ownership?',
      options: [
        'He found a rare sword in a game',
        'He lost years of gaming progress when a company shut down, but his blockchain items stayed safe in his wallet',
        'He learned to code',
        'He bought new games'
      ],
      correctAnswer: 1,
      explanation: 'Poor Miko lost everything when his favorite game shut down! But the items he owned on the blockchain stayed safely in his wallet. This taught him that TRUE ownership means only YOU control your stuff.',
      hint: 'Think about what happens when a game company closes...'
    }
  },
  {
    id: 'arcade-adventurer',
    title: 'Arcade Explorer',
    description: 'Join Zara on her first day discovering the magical Web3 arcade',
    bookNumber: 3,
    imageUrl: STORY_BADGE_IMAGES.arcadeAdventure,
    rarity: 'Rare',
    xpReward: 150,
    quiz: {
      question: 'What was special about the Quest Coins Zara earned at the arcade?',
      options: [
        'They were just regular game tokens that disappeared when she left',
        'They were real tokens she could trade, save, or use across different games and even redeem for real rewards',
        'They could only be used once',
        'They were made of chocolate'
      ],
      correctAnswer: 1,
      explanation: 'Zara was amazed! Unlike regular arcade tokens, Quest Coins were REAL digital assets. She could save them, trade them with friends, use them in any game at the arcade, or even redeem them for real-world merchandise!',
      hint: 'Quest Coins work differently than tokens at a regular arcade...'
    }
  },
  {
    id: 'tokenomics-wizard',
    title: 'Tokenomics Genius',
    description: 'Learn the secrets of Quest Coins economics with the whole crew',
    bookNumber: 5,
    imageUrl: STORY_BADGE_IMAGES.questTokenomics,
    rarity: 'Mythic',
    xpReward: 750,
    quiz: {
      question: 'In Book 5, why was the Quest Coins team working so hard on "tokenomics"?',
      options: [
        'They wanted to make a boring spreadsheet',
        'They were creating rules to make sure Quest Coins stay valuable and useful - like how many exist and how players earn them',
        'They were playing video games all day',
        'They forgot what they were doing'
      ],
      correctAnswer: 1,
      explanation: 'The team knew that good tokenomics is like the rules of a game\'s economy. They carefully planned how Quest Coins would be earned, spent, and traded to make sure they\'d always be valuable and fun to collect!',
      hint: 'Tokenomics is like designing the money rules for a game world...'
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
