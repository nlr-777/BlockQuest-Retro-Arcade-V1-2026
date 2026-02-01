from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import html
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import httpx
from collections import defaultdict
import time

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

# ===========================================
# SECURITY: Input Sanitization & Rate Limiting
# ===========================================

# SQL injection patterns to remove
SQL_INJECTION_PATTERNS = [
    r"--",           # SQL comment
    r";",            # Statement terminator
    r"'",            # Single quote
    r'"',            # Double quote
    r"\\",           # Backslash
    r"\bOR\b",       # OR keyword
    r"\bAND\b",      # AND keyword
    r"\bUNION\b",    # UNION keyword
    r"\bSELECT\b",   # SELECT keyword
    r"\bINSERT\b",   # INSERT keyword
    r"\bUPDATE\b",   # UPDATE keyword
    r"\bDELETE\b",   # DELETE keyword
    r"\bDROP\b",     # DROP keyword
    r"\bEXEC\b",     # EXEC keyword
    r"\bTRUNCATE\b", # TRUNCATE keyword
    r"=",            # Equals sign (used in SQL injection)
    r"\b1=1\b",      # Classic SQL injection
]

def sanitize_string(value: str, max_length: int = 100) -> str:
    """Sanitize user input to prevent XSS and SQL injection"""
    if not value:
        return value
    # HTML escape to prevent XSS
    sanitized = html.escape(value.strip())
    # Remove potential SQL injection patterns (case-insensitive)
    for pattern in SQL_INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
    # Truncate to max length
    return sanitized[:max_length]

def sanitize_username(value: str) -> str:
    """Sanitize username - only allow alphanumeric, underscore, dash"""
    if not value:
        return value
    # Remove any non-alphanumeric except underscore and dash
    sanitized = re.sub(r'[^a-zA-Z0-9_\-]', '', value.strip())
    return sanitized[:30]

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_REQUESTS = 30  # requests per window (lowered for better protection)
RATE_LIMIT_WINDOW = 60  # seconds

def get_client_ip(request: Request) -> str:
    """Get the real client IP, considering proxies"""
    # Check for forwarded header (from load balancers/proxies)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain (original client)
        return forwarded.split(",")[0].strip()
    # Fallback to direct client
    return request.client.host if request.client else "unknown"

def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    now = time.time()
    # Clean old entries
    rate_limit_storage[client_ip] = [
        t for t in rate_limit_storage[client_ip] 
        if now - t < RATE_LIMIT_WINDOW
    ]
    # Check limit
    if len(rate_limit_storage[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    # Add current request
    rate_limit_storage[client_ip].append(now)
    return True


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
    achievements: List[str] = []
    games_played: int = 0
    total_score: int = 0
    recent_scores: List[Dict[str, Any]] = []

class SyncProfileRequest(BaseModel):
    high_scores: Dict[str, int] = {}
    total_xp: int = 0
    level: int = 1
    badges: List[Dict[str, Any]] = []
    avatar_id: Optional[str] = None
    dao_voting_power: int = 0
    unlocked_story_badges: List[str] = []
    games_played: int = 0
    total_score: int = 0
    achievements: List[str] = []
    recent_scores: List[Dict[str, Any]] = []

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
async def submit_score(entry: LeaderboardEntryCreate, request: Request):
    """Submit a new score to the leaderboard"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    # Sanitize player name to prevent XSS
    sanitized_player_name = sanitize_string(entry.player_name, 50)
    
    entry_dict = entry.dict()
    entry_dict['player_name'] = sanitized_player_name
    entry_dict['id'] = str(uuid.uuid4())
    entry_dict['played_at'] = datetime.utcnow().isoformat()
    
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
async def create_player(player: PlayerProfileCreate, request: Request):
    """Create a new player profile"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    # Sanitize username
    clean_username = sanitize_username(player.username)
    if not clean_username or len(clean_username) < 2:
        raise HTTPException(status_code=400, detail="Invalid username")
    
    # Check if username exists
    existing = await db.players.find_one({"username": clean_username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    profile = PlayerProfile(username=clean_username)
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
async def mint_badge(badge_data: BadgeCreate, request: Request):
    """Mint a new badge for a player (off-chain NFT simulation)"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    # Sanitize badge data to prevent XSS
    badge = Badge(
        name=sanitize_string(badge_data.name, 50),
        description=sanitize_string(badge_data.description, 200),
        rarity=sanitize_string(badge_data.rarity, 20),
        game_id=sanitize_string(badge_data.game_id, 50),
        traits=badge_data.traits,  # JSON data is less vulnerable
        icon=sanitize_string(badge_data.icon, 50)
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
async def register(user_data: UserCreate, request: Request):
    """Register a new user with email and password"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    # Sanitize inputs
    clean_username = sanitize_username(user_data.username)
    clean_email = user_data.email.lower().strip()
    
    # Validate username
    if not clean_username or len(clean_username) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 alphanumeric characters")
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": clean_email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": clean_username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": clean_email,
        "username": clean_username,
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
    
    # Create a copy for insertion (MongoDB will add _id to it)
    user_for_db = user.copy()
    await db.users.insert_one(user_for_db)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    # Return original user dict without _id and password_hash
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """Login with email and password"""
    # Rate limiting to prevent brute force attacks
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
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
async def google_auth(auth_request: GoogleAuthRequest, request: Request):
    """Authenticate with Google ID token"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    try:
        # Verify the Google ID token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={auth_request.id_token}"
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_user = response.json()
            email = google_user.get("email")
            # Sanitize the username from Google
            raw_name = google_user.get("name", email.split("@")[0])
            name = sanitize_string(raw_name, 50)
            
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
            user_for_db = user.copy()
            await db.users.insert_one(user_for_db)
        
        # Create token
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Remove sensitive data from response
        user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
        
        return TokenResponse(access_token=access_token, user=user_response)
        
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to verify Google token")

# Google OAuth Session endpoint (for Emergent Auth)
class GoogleSessionRequest(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

@api_router.post("/auth/google-session", response_model=TokenResponse)
async def google_session_auth(session_data: GoogleSessionRequest, request: Request):
    """Authenticate with Google session from Emergent Auth"""
    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    email = session_data.email.lower()
    # Sanitize username from Google session
    sanitized_name = sanitize_string(session_data.name, 50)
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        # Update last login
        await db.users.update_one(
            {"id": existing_user["id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        user = existing_user
        user_id = existing_user["id"]
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "username": sanitized_name,  # Use sanitized name
            "password_hash": None,
            "created_at": datetime.utcnow().isoformat(),
            "auth_provider": "google",
            "google_id": session_data.id,
            "avatar_id": None,
            "picture": session_data.picture,
            "high_scores": {},
            "total_xp": 0,
            "level": 1,
            "badges": [],
            "dao_voting_power": 0,
            "unlocked_story_badges": [],
        }
        user_for_db = user.copy()
        await db.users.insert_one(user_for_db)
    
    # Create our own JWT token
    access_token = create_access_token(data={"sub": user_id})
    
    # Build response
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    
    return TokenResponse(access_token=access_token, user=user_response)

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
        unlocked_story_badges=user.get("unlocked_story_badges", []),
        achievements=user.get("achievements", []),
        games_played=user.get("games_played", 0),
        total_score=user.get("total_score", 0),
        recent_scores=user.get("recent_scores", [])
    )

@api_router.put("/auth/sync", response_model=UserResponse)
async def sync_profile(profile_data: SyncProfileRequest, user = Depends(get_current_user)):
    """Sync local profile data to cloud - MERGES data, keeping best values"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get existing user data for merging
    existing_high_scores = user.get("high_scores", {})
    existing_badges = user.get("badges", [])
    existing_story_badges = user.get("unlocked_story_badges", [])
    existing_achievements = user.get("achievements", [])
    
    # Merge high scores - keep the HIGHER score for each game
    merged_high_scores = {**existing_high_scores}
    for game_id, score in profile_data.high_scores.items():
        if score > merged_high_scores.get(game_id, 0):
            merged_high_scores[game_id] = score
    
    # Merge badges - keep all unique badges
    existing_badge_ids = {b.get('id') or b.get('name') for b in existing_badges}
    merged_badges = existing_badges.copy()
    for badge in profile_data.badges:
        badge_id = badge.get('id') or badge.get('name')
        if badge_id and badge_id not in existing_badge_ids:
            merged_badges.append(badge)
            existing_badge_ids.add(badge_id)
    
    # Merge story badges - keep all unique
    merged_story_badges = list(set(existing_story_badges + profile_data.unlocked_story_badges))
    
    # Merge achievements - keep all unique
    merged_achievements = list(set(existing_achievements + profile_data.achievements))
    
    # Take the HIGHER values for numeric fields
    merged_xp = max(user.get("total_xp", 0), profile_data.total_xp)
    merged_level = max(user.get("level", 1), profile_data.level)
    merged_voting_power = max(user.get("dao_voting_power", 0), profile_data.dao_voting_power)
    merged_games_played = max(user.get("games_played", 0), profile_data.games_played)
    merged_total_score = max(user.get("total_score", 0), profile_data.total_score)
    
    # Merge recent scores - keep last 20, newest first
    existing_recent = user.get("recent_scores", [])
    merged_recent = profile_data.recent_scores + existing_recent
    # Remove duplicates by keeping unique timestamps
    seen_times = set()
    unique_recent = []
    for score in merged_recent:
        score_time = score.get('playedAt', 0)
        if score_time not in seen_times:
            seen_times.add(score_time)
            unique_recent.append(score)
    merged_recent_scores = sorted(unique_recent, key=lambda x: x.get('playedAt', 0), reverse=True)[:20]
    
    # Update user profile with merged data
    update_data = {
        "high_scores": merged_high_scores,
        "total_xp": merged_xp,
        "level": merged_level,
        "badges": merged_badges,
        "avatar_id": profile_data.avatar_id or user.get("avatar_id"),
        "dao_voting_power": merged_voting_power,
        "unlocked_story_badges": merged_story_badges,
        "achievements": merged_achievements,
        "games_played": merged_games_played,
        "total_score": merged_total_score,
        "recent_scores": merged_recent_scores,
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
