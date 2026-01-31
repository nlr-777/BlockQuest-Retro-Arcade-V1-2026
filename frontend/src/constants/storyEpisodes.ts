// BlockQuest Official - Story Episodes Content
// Interactive story content with comic panels, dialogue, and choices

export interface StoryPanel {
  id: string;
  type: 'narration' | 'dialogue' | 'choice' | 'action' | 'reveal';
  character?: string; // character id for dialogue
  text: string;
  emotion?: 'happy' | 'excited' | 'worried' | 'thinking' | 'surprised' | 'determined';
  imageUrl?: string;
  choices?: StoryChoice[];
  effect?: 'shake' | 'glow' | 'flash' | 'confetti';
}

export interface StoryChoice {
  id: string;
  text: string;
  response: string; // What happens after choosing
  xpBonus?: number;
  isCorrect?: boolean; // For educational choices
}

export interface StoryEpisode {
  id: string;
  title: string;
  subtitle: string;
  bookNumber: number;
  icon: string;
  panels: StoryPanel[];
  rewards: {
    xp: number;
    badge?: string;
    coins?: number;
  };
}

// Character emotions mapping
export const CHARACTER_EMOTIONS = {
  happy: '😊',
  excited: '🤩',
  worried: '😟',
  thinking: '🤔',
  surprised: '😮',
  determined: '😤',
};

// ============================================
// EPISODE 1: The Digital Identity Discovery
// ============================================
export const EPISODE_1: StoryEpisode = {
  id: 'ep1-digital-identity',
  title: 'The Digital Identity Discovery',
  subtitle: 'Zara learns about owning her digital self',
  bookNumber: 1,
  icon: '🔐',
  panels: [
    {
      id: 'e1p1',
      type: 'narration',
      text: 'It was a rainy Tuesday when everything changed for Zara...',
      effect: 'glow',
    },
    {
      id: 'e1p2',
      type: 'dialogue',
      character: 'zara',
      text: "Ugh! My favorite game just deleted my account! Three years of progress... GONE!",
      emotion: 'worried',
    },
    {
      id: 'e1p3',
      type: 'dialogue',
      character: 'miko',
      text: "That happened to me too once. But then I discovered something amazing...",
      emotion: 'thinking',
    },
    {
      id: 'e1p4',
      type: 'narration',
      text: 'Miko pulled out his phone and showed Zara something she had never seen before.',
    },
    {
      id: 'e1p5',
      type: 'dialogue',
      character: 'miko',
      text: "This is a blockchain wallet. It's like a digital backpack that ONLY YOU control!",
      emotion: 'excited',
    },
    {
      id: 'e1p6',
      type: 'choice',
      text: 'Zara was curious. What should she ask first?',
      choices: [
        {
          id: 'c1a',
          text: '"But what if the wallet company shuts down?"',
          response: "Great question! Unlike regular accounts, your wallet exists on the blockchain - it can't be deleted by any company!",
          xpBonus: 50,
          isCorrect: true,
        },
        {
          id: 'c1b',
          text: '"Is it like a regular password?"',
          response: "Not quite! Instead of a password controlled by a company, you have a special key that only YOU own.",
          xpBonus: 25,
        },
        {
          id: 'c1c',
          text: '"Sounds complicated..."',
          response: "It might seem that way at first, but it's actually simpler - and way more secure!",
          xpBonus: 10,
        },
      ],
    },
    {
      id: 'e1p7',
      type: 'dialogue',
      character: 'zara',
      text: "Wait... so no company can delete MY stuff ever again?!",
      emotion: 'surprised',
    },
    {
      id: 'e1p8',
      type: 'dialogue',
      character: 'miko',
      text: "Exactly! Your digital identity belongs to YOU. Forever.",
      emotion: 'happy',
    },
    {
      id: 'e1p9',
      type: 'reveal',
      text: '💡 KEY LESSON: With blockchain wallets, YOU own your digital identity - no company can take it away!',
      effect: 'confetti',
    },
    {
      id: 'e1p10',
      type: 'action',
      text: 'Zara created her first wallet that day. Her digital adventure was just beginning...',
      effect: 'glow',
    },
  ],
  rewards: {
    xp: 100,
    badge: 'digital-identity-master',
    coins: 25,
  },
};

// ============================================
// EPISODE 2: The Arcade Adventure
// ============================================
export const EPISODE_2: StoryEpisode = {
  id: 'ep2-arcade-adventure',
  title: 'The Arcade Adventure',
  subtitle: 'Discovering the Quest Coins arcade',
  bookNumber: 3,
  icon: '🎮',
  panels: [
    {
      id: 'e2p1',
      type: 'narration',
      text: 'The next week, Miko invited Zara to a special place...',
    },
    {
      id: 'e2p2',
      type: 'dialogue',
      character: 'miko',
      text: "Welcome to the Quest Coins Arcade! This isn't like any arcade you've seen before.",
      emotion: 'excited',
    },
    {
      id: 'e2p3',
      type: 'dialogue',
      character: 'zara',
      text: "Whoa! Look at all these games! But wait... where do I get tokens?",
      emotion: 'surprised',
    },
    {
      id: 'e2p4',
      type: 'dialogue',
      character: 'kai',
      text: "Hey newbie! Here at Quest Coins, you don't just play - you EARN!",
      emotion: 'happy',
    },
    {
      id: 'e2p5',
      type: 'narration',
      text: 'Kai showed Zara a shimmering golden coin on his phone screen.',
    },
    {
      id: 'e2p6',
      type: 'dialogue',
      character: 'kai',
      text: "These Quest Coins are REAL tokens. You can save them, trade them, or use them in any game here!",
      emotion: 'determined',
    },
    {
      id: 'e2p7',
      type: 'choice',
      text: 'Zara wondered what made these coins special...',
      choices: [
        {
          id: 'c2a',
          text: '"Can I take them to other arcades too?"',
          response: "Eventually, yes! That's the magic of blockchain - your coins can work across different games and platforms!",
          xpBonus: 50,
          isCorrect: true,
        },
        {
          id: 'c2b',
          text: '"What happens when I leave?"',
          response: "Your coins stay in YOUR wallet! Unlike regular arcade tokens, they don't disappear when you go home.",
          xpBonus: 40,
        },
        {
          id: 'c2c',
          text: '"How many can I earn?"',
          response: "As many as you can! Play games, complete quests, help friends - there are tons of ways to earn!",
          xpBonus: 25,
        },
      ],
    },
    {
      id: 'e2p8',
      type: 'dialogue',
      character: 'zara',
      text: "This is amazing! I'm going to earn SO many Quest Coins!",
      emotion: 'excited',
    },
    {
      id: 'e2p9',
      type: 'action',
      text: 'Zara rushed to her first game, ready to start her collection...',
    },
    {
      id: 'e2p10',
      type: 'reveal',
      text: '💡 KEY LESSON: Quest Coins are real digital assets you OWN - not just arcade tokens that disappear!',
      effect: 'confetti',
    },
  ],
  rewards: {
    xp: 100,
    badge: 'arcade-adventurer',
    coins: 30,
  },
};

// ============================================
// EPISODE 3: True Ownership
// ============================================
export const EPISODE_3: StoryEpisode = {
  id: 'ep3-true-ownership',
  title: 'The Ownership Lesson',
  subtitle: "Miko's hard lesson about digital ownership",
  bookNumber: 2,
  icon: '💎',
  panels: [
    {
      id: 'e3p1',
      type: 'narration',
      text: 'One day, Miko came to the arcade looking really sad...',
    },
    {
      id: 'e3p2',
      type: 'dialogue',
      character: 'miko',
      text: "I can't believe it... Galaxy Warriors just shut down. All my rare items... gone forever.",
      emotion: 'worried',
    },
    {
      id: 'e3p3',
      type: 'dialogue',
      character: 'zara',
      text: "Oh no! Didn't you have that legendary sword you worked months for?",
      emotion: 'worried',
    },
    {
      id: 'e3p4',
      type: 'dialogue',
      character: 'miko',
      text: "Yeah... the Rainbow Dragon Blade. Two hundred hours of grinding... poof!",
      emotion: 'worried',
    },
    {
      id: 'e3p5',
      type: 'dialogue',
      character: 'kai',
      text: "But wait - check your wallet! Didn't you mint that sword as an NFT last month?",
      emotion: 'thinking',
    },
    {
      id: 'e3p6',
      type: 'narration',
      text: "Miko's eyes went wide as he checked his blockchain wallet...",
      effect: 'glow',
    },
    {
      id: 'e3p7',
      type: 'dialogue',
      character: 'miko',
      text: "IT'S STILL HERE! My Rainbow Dragon Blade is still in my wallet!",
      emotion: 'excited',
      effect: 'confetti',
    },
    {
      id: 'e3p8',
      type: 'choice',
      text: 'Why was the sword still there?',
      choices: [
        {
          id: 'c3a',
          text: 'Because blockchain items exist independently of any game company',
          response: "Exactly! When you truly OWN something on the blockchain, no company shutdown can take it away!",
          xpBonus: 50,
          isCorrect: true,
        },
        {
          id: 'c3b',
          text: 'Because Miko had a backup',
          response: "It's even better than a backup - blockchain ownership means the item exists on a network no single company controls!",
          xpBonus: 25,
        },
        {
          id: 'c3c',
          text: 'Because of magic',
          response: "Ha! It does feel like magic, but it's actually technology - decentralized blockchain technology!",
          xpBonus: 10,
        },
      ],
    },
    {
      id: 'e3p9',
      type: 'dialogue',
      character: 'kai',
      text: "And the best part? You could use that sword in OTHER games that support it!",
      emotion: 'happy',
    },
    {
      id: 'e3p10',
      type: 'reveal',
      text: '💡 KEY LESSON: TRUE ownership means your digital items exist on the blockchain - safe from any company shutdown!',
      effect: 'confetti',
    },
  ],
  rewards: {
    xp: 150,
    badge: 'blockchain-ownership-guru',
    coins: 40,
  },
};

// ============================================
// EPISODE 4: Founder NFT Power
// ============================================
export const EPISODE_4: StoryEpisode = {
  id: 'ep4-founder-nfts',
  title: 'The Founder Badge',
  subtitle: "Kai discovers his special powers",
  bookNumber: 4,
  icon: '🏆',
  panels: [
    {
      id: 'e4p1',
      type: 'narration',
      text: 'The arcade was buzzing with excitement about a big announcement...',
    },
    {
      id: 'e4p2',
      type: 'dialogue',
      character: 'zara',
      text: "What's everyone so hyped about?",
      emotion: 'thinking',
    },
    {
      id: 'e4p3',
      type: 'dialogue',
      character: 'kai',
      text: "The arcade is voting on adding new games! And guess what? My Founder NFT lets me vote!",
      emotion: 'excited',
    },
    {
      id: 'e4p4',
      type: 'dialogue',
      character: 'miko',
      text: "You have a Founder NFT?! Those are super rare!",
      emotion: 'surprised',
    },
    {
      id: 'e4p5',
      type: 'dialogue',
      character: 'kai',
      text: "I got it when I first joined, before anyone else knew about this place. It proves I believed in Quest Coins from the start!",
      emotion: 'happy',
    },
    {
      id: 'e4p6',
      type: 'narration',
      text: 'Kai showed them his special holographic badge, glowing with rainbow colors.',
      effect: 'glow',
    },
    {
      id: 'e4p7',
      type: 'choice',
      text: 'What makes Founder NFTs special?',
      choices: [
        {
          id: 'c4a',
          text: 'They give voting rights in the DAO and prove early supporter status',
          response: "Yes! Founder NFTs are proof of history AND give real power to help shape the community's future!",
          xpBonus: 50,
          isCorrect: true,
        },
        {
          id: 'c4b',
          text: 'They look really cool',
          response: "They DO look cool, but their real value is the community rights and historical proof they represent!",
          xpBonus: 20,
        },
        {
          id: 'c4c',
          text: 'They give unlimited coins',
          response: "Not unlimited coins, but something even better - a voice in deciding the arcade's future!",
          xpBonus: 10,
        },
      ],
    },
    {
      id: 'e4p8',
      type: 'dialogue',
      character: 'zara',
      text: "So early supporters actually get to help decide what happens here? That's so cool!",
      emotion: 'excited',
    },
    {
      id: 'e4p9',
      type: 'dialogue',
      character: 'kai',
      text: "That's the power of being a Founder. We're not just players - we're OWNERS.",
      emotion: 'determined',
    },
    {
      id: 'e4p10',
      type: 'reveal',
      text: '💡 KEY LESSON: Founder NFTs prove you were an early believer AND give you voting power in the community!',
      effect: 'confetti',
    },
  ],
  rewards: {
    xp: 200,
    badge: 'founder-nft-collector',
    coins: 50,
  },
};

// ============================================
// EPISODE 5: Tokenomics 101
// ============================================
export const EPISODE_5: StoryEpisode = {
  id: 'ep5-tokenomics',
  title: 'The Economics Experiment',
  subtitle: 'Learning how Quest Coins work',
  bookNumber: 5,
  icon: '📊',
  panels: [
    {
      id: 'e5p1',
      type: 'narration',
      text: 'The gang was curious about how Quest Coins kept their value...',
    },
    {
      id: 'e5p2',
      type: 'dialogue',
      character: 'zara',
      text: "I've earned 500 Quest Coins! But how do we know they'll stay valuable?",
      emotion: 'thinking',
    },
    {
      id: 'e5p3',
      type: 'dialogue',
      character: 'miko',
      text: "My dad says that's called 'tokenomics' - the rules that make tokens work!",
      emotion: 'happy',
    },
    {
      id: 'e5p4',
      type: 'dialogue',
      character: 'kai',
      text: "It's like the rules of a game's economy. If everyone could spawn infinite gold, it would be worthless!",
      emotion: 'determined',
    },
    {
      id: 'e5p5',
      type: 'narration',
      text: 'The arcade manager appeared on the big screen to explain...',
    },
    {
      id: 'e5p6',
      type: 'dialogue',
      character: 'zara',
      text: "So there's a limited number of Quest Coins? Like rare Pokémon cards?",
      emotion: 'surprised',
    },
    {
      id: 'e5p7',
      type: 'choice',
      text: 'What makes good tokenomics?',
      choices: [
        {
          id: 'c5a',
          text: 'Balanced earning, spending, and limited supply',
          response: "Perfect! Good tokenomics balances how coins are earned, spent, and limits total supply to maintain value!",
          xpBonus: 50,
          isCorrect: true,
        },
        {
          id: 'c5b',
          text: 'Making coins really hard to get',
          response: "Not just hard - it needs to be FUN to earn while still being valuable. That's the balance!",
          xpBonus: 25,
        },
        {
          id: 'c5c',
          text: 'Giving everyone lots of free coins',
          response: "If everyone has unlimited coins, they become worthless! Scarcity creates value.",
          xpBonus: 15,
        },
      ],
    },
    {
      id: 'e5p8',
      type: 'dialogue',
      character: 'miko',
      text: "So when I earn coins by being skilled, they're worth MORE because not everyone can earn them easily!",
      emotion: 'excited',
    },
    {
      id: 'e5p9',
      type: 'dialogue',
      character: 'kai',
      text: "Exactly! Your skill and time have REAL value here.",
      emotion: 'happy',
    },
    {
      id: 'e5p10',
      type: 'reveal',
      text: '💡 KEY LESSON: Tokenomics is the science of making digital currencies valuable through smart rules about supply and earning!',
      effect: 'confetti',
    },
  ],
  rewards: {
    xp: 250,
    badge: 'tokenomics-wizard',
    coins: 75,
  },
};

// All episodes collection
export const STORY_EPISODES: StoryEpisode[] = [
  EPISODE_1,
  EPISODE_2,
  EPISODE_3,
  EPISODE_4,
  EPISODE_5,
];

// Get episode by ID
export const getEpisodeById = (id: string): StoryEpisode | undefined => {
  return STORY_EPISODES.find(ep => ep.id === id);
};

// Get episodes by book number
export const getEpisodesByBook = (bookNumber: number): StoryEpisode[] => {
  return STORY_EPISODES.filter(ep => ep.bookNumber === bookNumber);
};
