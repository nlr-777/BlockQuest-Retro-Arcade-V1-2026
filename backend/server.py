from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'blockquest-super-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = await db.users.find_one({"id": user_id})
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

# Create the main app without a prefix
app = FastAPI(title="Block Quest Official - The Arcade API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ================== MODELS ==================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_name: str
    game_id: str
    score: int
    duration: int = 0  # game duration in seconds
    played_at: datetime = Field(default_factory=datetime.utcnow)

class LeaderboardEntryCreate(BaseModel):
    player_id: str
    player_name: str
    game_id: str
    score: int
    duration: int = 0

class LeaderboardEntryResponse(BaseModel):
    id: str
    player_id: str
    player_name: str
    game_id: str
    score: int
    duration: int
    played_at: str

# Player Profile Models
class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    rarity: str  # Common, Rare, Epic, Legendary
    game_id: str
    minted_at: datetime = Field(default_factory=datetime.utcnow)
    traits: Dict[str, Any] = {}
    icon: str

class PlayerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_score: int = 0
    games_played: int = 0
    badges: List[Badge] = []
    dao_voting_power: int = 0
    level: int = 1
    xp: int = 0

class PlayerProfileCreate(BaseModel):
    username: str

class PlayerProfileResponse(BaseModel):
    id: str
    username: str
    created_at: str
    total_score: int
    games_played: int
    badges: List[Badge]
    dao_voting_power: int
    level: int
    xp: int

# Badge Creation
class BadgeCreate(BaseModel):
    player_id: str
    name: str
    description: str
    rarity: str
    game_id: str
    traits: Dict[str, Any] = {}
    icon: str

# ================== AUTH MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    created_at: str
    avatar_id: Optional[str] = None
    high_scores: Dict[str, int] = {}
    total_xp: int = 0
    level: int = 1
    badges: List[Dict[str, Any]] = []
    dao_voting_power: int = 0
    unlocked_story_badges: List[str] = []

class SyncProfileRequest(BaseModel):
    high_scores: Dict[str, int] = {}
    total_xp: int = 0
    level: int = 1
    badges: List[Dict[str, Any]] = []
    avatar_id: Optional[str] = None
    dao_voting_power: int = 0
    unlocked_story_badges: List[str] = []

# ================== ROUTES ==================

@api_router.get("/")
async def root():
    return {"message": "Block Quest Official - The Arcade API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Status routes (existing)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ================== LEADERBOARD ROUTES ==================

@api_router.post("/leaderboard", response_model=LeaderboardEntryResponse)
async def submit_score(entry: LeaderboardEntryCreate):
    """Submit a new score to the leaderboard"""
    entry_obj = LeaderboardEntry(**entry.dict())
    entry_dict = entry_obj.dict()
    entry_dict['played_at'] = entry_dict['played_at'].isoformat()
    
    await db.leaderboard.insert_one(entry_dict)
    
    return LeaderboardEntryResponse(**entry_dict)

@api_router.get("/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_global_leaderboard(limit: int = 50):
    """Get top scores across all games"""
    cursor = db.leaderboard.find().sort("score", -1).limit(limit)
    entries = await cursor.to_list(limit)
    
    return [LeaderboardEntryResponse(
        id=str(e.get('id', e.get('_id', ''))),
        player_id=e['player_id'],
        player_name=e['player_name'],
        game_id=e['game_id'],
        score=e['score'],
        duration=e.get('duration', 0),
        played_at=e['played_at'] if isinstance(e['played_at'], str) else e['played_at'].isoformat()
    ) for e in entries]

@api_router.get("/leaderboard/{game_id}", response_model=List[LeaderboardEntryResponse])
async def get_game_leaderboard(game_id: str, limit: int = 50):
    """Get top scores for a specific game"""
    cursor = db.leaderboard.find({"game_id": game_id}).sort("score", -1).limit(limit)
    entries = await cursor.to_list(limit)
    
    return [LeaderboardEntryResponse(
        id=str(e.get('id', e.get('_id', ''))),
        player_id=e['player_id'],
        player_name=e['player_name'],
        game_id=e['game_id'],
        score=e['score'],
        duration=e.get('duration', 0),
        played_at=e['played_at'] if isinstance(e['played_at'], str) else e['played_at'].isoformat()
    ) for e in entries]

@api_router.get("/leaderboard/player/{player_id}", response_model=List[LeaderboardEntryResponse])
async def get_player_scores(player_id: str, limit: int = 20):
    """Get a player's recent scores"""
    cursor = db.leaderboard.find({"player_id": player_id}).sort("played_at", -1).limit(limit)
    entries = await cursor.to_list(limit)
    
    return [LeaderboardEntryResponse(
        id=str(e.get('id', e.get('_id', ''))),
        player_id=e['player_id'],
        player_name=e['player_name'],
        game_id=e['game_id'],
        score=e['score'],
        duration=e.get('duration', 0),
        played_at=e['played_at'] if isinstance(e['played_at'], str) else e['played_at'].isoformat()
    ) for e in entries]

# ================== PLAYER PROFILE ROUTES ==================

@api_router.post("/players", response_model=PlayerProfileResponse)
async def create_player(player: PlayerProfileCreate):
    """Create a new player profile"""
    # Check if username exists
    existing = await db.players.find_one({"username": player.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    profile = PlayerProfile(username=player.username)
    profile_dict = profile.dict()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    
    await db.players.insert_one(profile_dict)
    
    return PlayerProfileResponse(**profile_dict)

@api_router.get("/players/{player_id}", response_model=PlayerProfileResponse)
async def get_player(player_id: str):
    """Get a player profile by ID"""
    player = await db.players.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerProfileResponse(
        id=player['id'],
        username=player['username'],
        created_at=player['created_at'] if isinstance(player['created_at'], str) else player['created_at'].isoformat(),
        total_score=player.get('total_score', 0),
        games_played=player.get('games_played', 0),
        badges=player.get('badges', []),
        dao_voting_power=player.get('dao_voting_power', 0),
        level=player.get('level', 1),
        xp=player.get('xp', 0)
    )

@api_router.post("/badges", response_model=Badge)
async def mint_badge(badge_data: BadgeCreate):
    """Mint a new badge for a player (off-chain NFT simulation)"""
    badge = Badge(
        name=badge_data.name,
        description=badge_data.description,
        rarity=badge_data.rarity,
        game_id=badge_data.game_id,
        traits=badge_data.traits,
        icon=badge_data.icon
    )
    
    # Update player's badges
    await db.players.update_one(
        {"id": badge_data.player_id},
        {
            "$push": {"badges": badge.dict()},
            "$inc": {
                "dao_voting_power": 10 if badge_data.rarity == "Legendary" else 5 if badge_data.rarity == "Epic" else 2 if badge_data.rarity == "Rare" else 1
            }
        }
    )
    
    return badge

@api_router.get("/badges/{player_id}", response_model=List[Badge])
async def get_player_badges(player_id: str):
    """Get all badges for a player"""
    player = await db.players.find_one({"id": player_id})
    if not player:
        return []
    
    return player.get('badges', [])

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user with email and password"""
    # Check if email exists
    existing_email = await db.users.find_one({"email": user_data.email.lower()})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "username": user_data.username,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow().isoformat(),
        "auth_provider": "email",
        "avatar_id": None,
        "high_scores": {},
        "total_xp": 0,
        "level": 1,
        "badges": [],
        "dao_voting_power": 0,
        "unlocked_story_badges": [],
    }
    
    await db.users.insert_one(user)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    # Remove password hash from response
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google Sign-In for this account")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Remove password hash from response
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google ID token"""
    try:
        # Verify the Google ID token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={request.id_token}"
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_user = response.json()
            email = google_user.get("email")
            name = google_user.get("name", email.split("@")[0])
            
            if not email:
                raise HTTPException(status_code=401, detail="Email not provided by Google")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email.lower()})
        
        if existing_user:
            # Update last login
            await db.users.update_one(
                {"id": existing_user["id"]},
                {"$set": {"last_login": datetime.utcnow().isoformat()}}
            )
            user = existing_user
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            user = {
                "id": user_id,
                "email": email.lower(),
                "username": name,
                "password_hash": None,  # No password for Google users
                "created_at": datetime.utcnow().isoformat(),
                "auth_provider": "google",
                "google_id": google_user.get("sub"),
                "avatar_id": None,
                "high_scores": {},
                "total_xp": 0,
                "level": 1,
                "badges": [],
                "dao_voting_power": 0,
                "unlocked_story_badges": [],
            }
            await db.users.insert_one(user)
        
        # Create token
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Remove sensitive data from response
        user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
        
        return TokenResponse(access_token=access_token, user=user_response)
        
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to verify Google token")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(user = Depends(get_current_user)):
    """Get current logged-in user's profile"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        created_at=user.get("created_at", ""),
        avatar_id=user.get("avatar_id"),
        high_scores=user.get("high_scores", {}),
        total_xp=user.get("total_xp", 0),
        level=user.get("level", 1),
        badges=user.get("badges", []),
        dao_voting_power=user.get("dao_voting_power", 0),
        unlocked_story_badges=user.get("unlocked_story_badges", [])
    )

@api_router.put("/auth/sync", response_model=UserResponse)
async def sync_profile(profile_data: SyncProfileRequest, user = Depends(get_current_user)):
    """Sync local profile data to cloud"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Update user profile with synced data
    update_data = {
        "high_scores": profile_data.high_scores,
        "total_xp": profile_data.total_xp,
        "level": profile_data.level,
        "badges": profile_data.badges,
        "avatar_id": profile_data.avatar_id,
        "dao_voting_power": profile_data.dao_voting_power,
        "unlocked_story_badges": profile_data.unlocked_story_badges,
        "last_sync": datetime.utcnow().isoformat()
    }
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user["id"]})
    
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        username=updated_user["username"],
        created_at=updated_user.get("created_at", ""),
        avatar_id=updated_user.get("avatar_id"),
        high_scores=updated_user.get("high_scores", {}),
        total_xp=updated_user.get("total_xp", 0),
        level=updated_user.get("level", 1),
        badges=updated_user.get("badges", []),
        dao_voting_power=updated_user.get("dao_voting_power", 0),
        unlocked_story_badges=updated_user.get("unlocked_story_badges", [])
    )

# ================== GAME STATS ROUTES ==================

@api_router.get("/stats/games")
async def get_game_stats():
    """Get statistics for all games"""
    pipeline = [
        {
            "$group": {
                "_id": "$game_id",
                "total_plays": {"$sum": 1},
                "total_score": {"$sum": "$score"},
                "avg_score": {"$avg": "$score"},
                "max_score": {"$max": "$score"},
                "total_duration": {"$sum": "$duration"}
            }
        }
    ]
    
    stats = await db.leaderboard.aggregate(pipeline).to_list(100)
    
    return {stat['_id']: {
        "total_plays": stat['total_plays'],
        "total_score": stat['total_score'],
        "avg_score": round(stat['avg_score'], 2) if stat['avg_score'] else 0,
        "max_score": stat['max_score'],
        "total_duration": stat['total_duration']
    } for stat in stats}

@api_router.get("/stats/global")
async def get_global_stats():
    """Get global arcade statistics"""
    total_players = await db.players.count_documents({})
    total_games = await db.leaderboard.count_documents({})
    total_badges = await db.players.aggregate([
        {"$unwind": "$badges"},
        {"$count": "total"}
    ]).to_list(1)
    
    return {
        "total_players": total_players,
        "total_games_played": total_games,
        "total_badges_minted": total_badges[0]['total'] if total_badges else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
