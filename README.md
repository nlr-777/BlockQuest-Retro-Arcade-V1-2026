# 🎮 BlockQuest Official - Retro Arcade Hub

A feature-rich, kid-friendly retro arcade game hub built with Expo (React Native) and FastAPI. Features 15 mini-games with a nostalgic synthwave/CRT aesthetic, user authentication, cloud progress sync, and a faction system.

![BlockQuest Banner](https://via.placeholder.com/800x400/0D0221/FF00FF?text=🎮+BlockQuest+Arcade)

## ✨ Features

### 🕹️ 15 Mini-Games
- **Chain Builder** - Snake meets blockchain! Build the longest chain
- **Block Muncher** - Pac-Man style maze navigation
- **Token Tumble** - Tetris-inspired block stacking
- **Chain Invaders** - Space Invaders with consensus voting
- **Hash Hopper** - Frogger-style lane crossing
- **Seed Sprint** - Endless runner collecting seed phrases
- **Crypto Climber** - Donkey Kong platforming
- **Bridge Bouncer** - Cross-chain bridge mechanics
- **Contract Crusher** - Breakout-style block breaking
- **DAO Duel** - Governance-themed battles
- **IPFS Pinball** - Classic pinball action
- **Stake Smash** - Staking-themed arcade
- **Lightning Dash** - Speed-based challenges
- **Ledger Leap** - Precision jumping
- **Mine Blaster** - Mining-themed puzzles

### 🎨 Retro Aesthetic
- Authentic CRT scanlines and glow effects
- Neon synthwave color palette
- Pixel rain particle effects
- 8-bit inspired UI components
- Procedural retro music engine

### 👤 User System
- Guest play with local progress saving
- Email/password registration
- Google OAuth authentication
- Cross-device cloud sync
- Progress merging (keeps best scores)

### 🏆 Progression
- XP and leveling system
- Achievement badges
- Global and per-game leaderboards
- Faction/DAO membership
- Daily rewards

### ♿ Accessibility
- High contrast mode
- Large text option
- Reduce motion setting
- Screen reader support

## 🛠️ Tech Stack

### Frontend
- **Framework**: Expo SDK 54 (React Native)
- **Router**: Expo Router (file-based routing)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated
- **Styling**: StyleSheet with CRT theme system

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: XSS sanitization, SQL injection prevention, rate limiting

### Database Schema (Supabase)

#### `game_stats` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | User identifier |
| score | Integer | Current high score |
| inventory | JSONB | All player data (badges, XP, faction, etc.) |
| last_played | Timestamptz | Last activity timestamp |

#### `site_content` Table
| Column | Type | Description |
|--------|------|-------------|
| id | Serial | Primary Key |
| title | Text | Content title |
| type | Text | 'video', 'book', or 'game' |
| url | Text | Link URL |
| thumbnail_url | Text | Preview image URL |

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI server with all endpoints
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── app/               # Expo Router pages
│   │   ├── _layout.tsx    # Root layout with navigation
│   │   ├── index.tsx      # Main game hub screen
│   │   ├── welcome.tsx    # Onboarding with mini-game
│   │   ├── login.tsx      # Authentication screen
│   │   ├── settings.tsx   # Settings & preferences
│   │   ├── vault.tsx      # Badges & wallet
│   │   ├── factions.tsx   # DAO/Faction system
│   │   └── games/         # Individual game screens
│   │
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── constants/     # Colors, themes, config
│   │   ├── services/      # API & utility services
│   │   ├── store/         # Zustand state stores
│   │   ├── utils/         # Audio, TTS, helpers
│   │   └── vfx/           # Visual effects
│   │
│   ├── app.json           # Expo configuration
│   └── package.json       # Node dependencies
│
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Supabase account (free tier available)
- Yarn package manager

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install

# Start Expo development server
yarn start

# Or start for specific platform
yarn web      # Web browser
yarn ios      # iOS simulator
yarn android  # Android emulator
```

### Environment Variables

#### Backend (.env)
```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Secret (Change in production!)
JWT_SECRET_KEY=your-secret-key-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
```

#### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the required tables:

```sql
-- Game Stats Table
CREATE TABLE game_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    score INTEGER DEFAULT 0,
    inventory JSONB DEFAULT '{}',
    last_played TIMESTAMPTZ DEFAULT NOW()
);

-- Site Content Table
CREATE TABLE site_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'book', 'game')),
    url TEXT NOT NULL,
    thumbnail_url TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX idx_site_content_type ON site_content(type);
```

3. Copy your project URL and anon key from Settings > API

## 🔒 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/sync` | Sync progress to cloud |

### Site Content (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content` | Get all site content |
| GET | `/api/content/videos` | Get YouTube videos |
| GET | `/api/content/books` | Get book links |
| GET | `/api/content/games` | Get game content |

### Game Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboard/{game_id}` | Game-specific leaderboard |
| POST | `/api/leaderboard` | Submit score |
| POST | `/api/players` | Create player profile |
| POST | `/api/badges` | Mint achievement badge |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/games` | Per-game statistics |
| GET | `/api/stats/global` | Global arcade stats |
| GET | `/api/health` | API health check |

## 🔐 Security Features

- **XSS Prevention**: All user inputs are HTML-escaped
- **SQL Injection Protection**: Dangerous patterns removed from inputs
- **Rate Limiting**: 30 requests/minute per IP on sensitive endpoints
- **JWT Authentication**: Secure token-based auth with 30-day expiry
- **Password Hashing**: bcrypt with automatic salt

## 🎮 Game Development

### Adding a New Game

1. Create game file in `/frontend/app/games/your-game.tsx`
2. Add game entry to `GAMES` array in `/frontend/app/index.tsx`
3. Implement game logic with `useGameAudio` hook for sounds
4. Use `GameRewardsModal` for XP rewards on completion

### Game Template
```tsx
import { useGameAudio } from '../../src/hooks/useGameAudio';

export default function YourGame() {
  const { playSound } = useGameAudio();
  
  const handleScore = () => {
    playSound('collect');
    // Update score...
  };
  
  return (
    <View style={styles.container}>
      {/* Game UI */}
    </View>
  );
}
```

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Web | ✅ Full Support | Primary development target |
| iOS | ✅ Supported | Via Expo Go or build |
| Android | ✅ Supported | Via Expo Go or build |

## 🚀 Deployment

### Vercel (Frontend Static Export)
```bash
cd frontend
yarn build
yarn export
# Deploy the 'dist' folder to Vercel
```

### Backend Deployment
The backend can be deployed to any Python hosting service:
- Railway
- Render
- Fly.io
- AWS Lambda (with Mangum)

Make sure to set your Supabase environment variables in your hosting dashboard.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic arcade games and Web3 concepts
- Built with [Expo](https://expo.dev/) and [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [Supabase](https://supabase.com/)
- Retro aesthetic inspired by synthwave and vaporwave culture

---

**Made with ❤️ and lots of pixels**

*"Building the future, one block at a time"* 🎮⛓️
