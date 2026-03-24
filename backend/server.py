from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
import re
import html
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
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

# ===========================================
# SUPABASE CONNECTION
# ===========================================
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    logging.warning("Supabase credentials not found. Database operations will fail.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    return supabase

# Auth configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'blockquest-super-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# ===========================================
# SECURITY: Input Sanitization & Rate Limiting
# ===========================================

SQL_INJECTION_PATTERNS = [
    r"--", r";", r"'", r'"', r"\\",
    r"\bOR\b", r"\bAND\b", r"\bUNION\b", r"\bSELECT\b",
    r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b", r"\bDROP\b",
    r"\bEXEC\b", r"\bTRUNCATE\b", r"=", r"\b1=1\b",
]

def sanitize_string(value: str, max_length: int = 100) -> str:
    """Sanitize user input to prevent XSS and SQL injection"""
    if not value:
        return value
    sanitized = html.escape(value.strip())
    for pattern in SQL_INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
    return sanitized[:max_length]

def sanitize_username(value: str) -> str:
    """Sanitize username - only allow alphanumeric, underscore, dash"""
    if not value:
        return value
    sanitized = re.sub(r'[^a-zA-Z0-9_\-]', '', value.strip())
    return sanitized[:30]

# Rate limiting storage
rate_limit_storage: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW = 60

def get_client_ip(request: Request) -> str:
    """Get the real client IP, considering proxies"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    now = time.time()
    rate_limit_storage[client_ip] = [
        t for t in rate_limit_storage[client_ip] 
        if now - t < RATE_LIMIT_WINDOW
    ]
    if len(rate_limit_storage[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    rate_limit_storage[client_ip].append(now)
    return True

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_supabase)
):
    """Get the current authenticated user from JWT token"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        # Fetch user from game_stats table
        response = db.table("game_stats").select("*").eq("user_id", user_id).execute()
        if response.data:
            user_data = response.data[0]
            # Extract user info from inventory JSONB
            inventory = user_data.get("inventory", {})
            return {
                "id": user_data["user_id"],
                "user_id": user_data["user_id"],
                "score": user_data.get("score", 0),
                "last_played": user_data.get("last_played"),
                **inventory  # Spread all inventory data (email, username, badges, etc.)
            }
        return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

# Create the main app
app = FastAPI(title="Block Quest Official - The Arcade API")
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
    duration: int = 0
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
    rarity: str
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
    faction_id: Optional[str] = None
    faction_joined_at: Optional[int] = None
    faction_xp_contributed: int = 0
    faction_votes_participated: int = 0
    faction_member_rank: str = "Rookie"
    faction_votes: Dict[str, str] = {}

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
    faction_id: Optional[str] = None
    faction_joined_at: Optional[int] = None
    faction_xp_contributed: int = 0
    faction_votes_participated: int = 0
    faction_member_rank: str = "Rookie"
    faction_votes: Dict[str, str] = {}

# ================== SITE CONTENT MODELS ==================

class SiteContentResponse(BaseModel):
    id: int
    title: str
    type: str
    url: str
    thumbnail_url: Optional[str] = None

# ================== ROUTES ==================

@api_router.get("/")
async def root():
    return {"message": "Block Quest Official - The Arcade API", "version": "2.0.0", "database": "Supabase"}

@api_router.get("/health")
async def health_check(db: Client = Depends(get_supabase)):
    """Health check with database connectivity test"""
    try:
        # Test Supabase connection
        response = db.table("site_content").select("id").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status
    }

# ================== SITE CONTENT ROUTES ==================

@api_router.get("/content/videos", response_model=List[SiteContentResponse])
async def get_video_content(db: Client = Depends(get_supabase)):
    """Get all YouTube video content for the landing page"""
    try:
        response = db.table("site_content").select("*").eq("type", "video").execute()
        return [SiteContentResponse(**item) for item in response.data]
    except Exception as e:
        logging.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch video content")

@api_router.get("/content/books", response_model=List[SiteContentResponse])
async def get_book_content(db: Client = Depends(get_supabase)):
    """Get all book links for the landing page"""
    try:
        response = db.table("site_content").select("*").eq("type", "book").execute()
        return [SiteContentResponse(**item) for item in response.data]
    except Exception as e:
        logging.error(f"Error fetching books: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch book content")

@api_router.get("/content/games", response_model=List[SiteContentResponse])
async def get_game_content(db: Client = Depends(get_supabase)):
    """Get all game content"""
    try:
        response = db.table("site_content").select("*").eq("type", "game").execute()
        return [SiteContentResponse(**item) for item in response.data]
    except Exception as e:
        logging.error(f"Error fetching games: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch game content")

@api_router.get("/content", response_model=List[SiteContentResponse])
async def get_all_content(db: Client = Depends(get_supabase), content_type: Optional[str] = None):
    """Get all site content, optionally filtered by type"""
    try:
        query = db.table("site_content").select("*")
        if content_type:
            query = query.eq("type", content_type)
        response = query.execute()
        return [SiteContentResponse(**item) for item in response.data]
    except Exception as e:
        logging.error(f"Error fetching content: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch content")

# ================== LEADERBOARD ROUTES ==================

@api_router.post("/leaderboard", response_model=LeaderboardEntryResponse)
async def submit_score(entry: LeaderboardEntryCreate, request: Request, db: Client = Depends(get_supabase)):
    """Submit a new score to the leaderboard (stored in game_stats inventory)"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    sanitized_player_name = sanitize_string(entry.player_name, 50)
    entry_id = str(uuid.uuid4())
    played_at = datetime.utcnow().isoformat()
    
    # Create leaderboard entry in inventory format
    leaderboard_entry = {
        "id": entry_id,
        "player_id": entry.player_id,
        "player_name": sanitized_player_name,
        "game_id": entry.game_id,
        "score": entry.score,
        "duration": entry.duration,
        "played_at": played_at
    }
    
    try:
        # Check if player has a game_stats record
        existing = db.table("game_stats").select("*").eq("user_id", entry.player_id).execute()
        
        if existing.data:
            # Update existing record
            current_inventory = existing.data[0].get("inventory", {})
            leaderboard_entries = current_inventory.get("leaderboard_entries", [])
            leaderboard_entries.append(leaderboard_entry)
            current_inventory["leaderboard_entries"] = leaderboard_entries[-100]  # Keep last 100
            
            # Update high score if applicable
            high_scores = current_inventory.get("high_scores", {})
            if entry.score > high_scores.get(entry.game_id, 0):
                high_scores[entry.game_id] = entry.score
            current_inventory["high_scores"] = high_scores
            
            db.table("game_stats").update({
                "score": max(existing.data[0].get("score", 0), entry.score),
                "inventory": current_inventory,
                "last_played": played_at
            }).eq("user_id", entry.player_id).execute()
        else:
            # Create new record
            db.table("game_stats").insert({
                "user_id": entry.player_id,
                "score": entry.score,
                "inventory": {
                    "leaderboard_entries": [leaderboard_entry],
                    "high_scores": {entry.game_id: entry.score}
                },
                "last_played": played_at
            }).execute()
        
        return LeaderboardEntryResponse(**leaderboard_entry)
    except Exception as e:
        logging.error(f"Error submitting score: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit score")

@api_router.get("/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_global_leaderboard(limit: int = 50, db: Client = Depends(get_supabase)):
    """Get top scores across all games"""
    try:
        response = db.table("game_stats").select("*").order("score", desc=True).limit(limit).execute()
        
        entries = []
        for record in response.data:
            inventory = record.get("inventory", {})
            leaderboard_entries = inventory.get("leaderboard_entries", [])
            for entry in leaderboard_entries:
                entries.append(LeaderboardEntryResponse(
                    id=entry.get("id", str(uuid.uuid4())),
                    player_id=entry.get("player_id", record["user_id"]),
                    player_name=entry.get("player_name", inventory.get("username", "Anonymous")),
                    game_id=entry.get("game_id", "unknown"),
                    score=entry.get("score", 0),
                    duration=entry.get("duration", 0),
                    played_at=entry.get("played_at", record.get("last_played", ""))
                ))
        
        # Sort by score and return top entries
        entries.sort(key=lambda x: x.score, reverse=True)
        return entries[:limit]
    except Exception as e:
        logging.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard")

@api_router.get("/leaderboard/{game_id}", response_model=List[LeaderboardEntryResponse])
async def get_game_leaderboard(game_id: str, limit: int = 50, db: Client = Depends(get_supabase)):
    """Get top scores for a specific game"""
    try:
        # Optimized: Only fetch top records by score, limited
        response = db.table("game_stats").select("user_id,score,inventory,last_played").order("score", desc=True).limit(100).execute()
        
        entries = []
        for record in response.data:
            inventory = record.get("inventory", {})
            leaderboard_entries = inventory.get("leaderboard_entries", [])
            for entry in leaderboard_entries:
                if entry.get("game_id") == game_id:
                    entries.append(LeaderboardEntryResponse(
                        id=entry.get("id", str(uuid.uuid4())),
                        player_id=entry.get("player_id", record["user_id"]),
                        player_name=entry.get("player_name", inventory.get("username", "Anonymous")),
                        game_id=entry.get("game_id", game_id),
                        score=entry.get("score", 0),
                        duration=entry.get("duration", 0),
                        played_at=entry.get("played_at", record.get("last_played", ""))
                    ))
        
        entries.sort(key=lambda x: x.score, reverse=True)
        return entries[:limit]
    except Exception as e:
        logging.error(f"Error fetching game leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch game leaderboard")

@api_router.get("/leaderboard/player/{player_id}", response_model=List[LeaderboardEntryResponse])
async def get_player_scores(player_id: str, limit: int = 20, db: Client = Depends(get_supabase)):
    """Get a player's recent scores"""
    try:
        response = db.table("game_stats").select("*").eq("user_id", player_id).execute()
        
        if not response.data:
            return []
        
        record = response.data[0]
        inventory = record.get("inventory", {})
        leaderboard_entries = inventory.get("leaderboard_entries", [])
        
        entries = [
            LeaderboardEntryResponse(
                id=entry.get("id", str(uuid.uuid4())),
                player_id=entry.get("player_id", player_id),
                player_name=entry.get("player_name", inventory.get("username", "Anonymous")),
                game_id=entry.get("game_id", "unknown"),
                score=entry.get("score", 0),
                duration=entry.get("duration", 0),
                played_at=entry.get("played_at", record.get("last_played", ""))
            )
            for entry in leaderboard_entries
        ]
        
        # Sort by played_at descending
        entries.sort(key=lambda x: x.played_at, reverse=True)
        return entries[:limit]
    except Exception as e:
        logging.error(f"Error fetching player scores: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player scores")

# ================== PLAYER PROFILE ROUTES ==================

@api_router.post("/players", response_model=PlayerProfileResponse)
async def create_player(player: PlayerProfileCreate, request: Request, db: Client = Depends(get_supabase)):
    """Create a new player profile"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    clean_username = sanitize_username(player.username)
    if not clean_username or len(clean_username) < 2:
        raise HTTPException(status_code=400, detail="Invalid username")
    
    player_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    try:
        # Check if username exists in any inventory
        existing = db.table("game_stats").select("inventory").execute()
        for record in existing.data:
            if record.get("inventory", {}).get("username") == clean_username:
                raise HTTPException(status_code=400, detail="Username already taken")
        
        # Create new player in game_stats
        db.table("game_stats").insert({
            "user_id": player_id,
            "score": 0,
            "inventory": {
                "username": clean_username,
                "created_at": created_at,
                "total_score": 0,
                "games_played": 0,
                "badges": [],
                "dao_voting_power": 0,
                "level": 1,
                "xp": 0
            },
            "last_played": created_at
        }).execute()
        
        return PlayerProfileResponse(
            id=player_id,
            username=clean_username,
            created_at=created_at,
            total_score=0,
            games_played=0,
            badges=[],
            dao_voting_power=0,
            level=1,
            xp=0
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating player: {e}")
        raise HTTPException(status_code=500, detail="Failed to create player")

@api_router.get("/players/{player_id}", response_model=PlayerProfileResponse)
async def get_player(player_id: str, db: Client = Depends(get_supabase)):
    """Get a player profile by ID"""
    try:
        response = db.table("game_stats").select("*").eq("user_id", player_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Player not found")
        
        record = response.data[0]
        inventory = record.get("inventory", {})
        
        return PlayerProfileResponse(
            id=player_id,
            username=inventory.get("username", "Anonymous"),
            created_at=inventory.get("created_at", record.get("last_played", "")),
            total_score=inventory.get("total_score", record.get("score", 0)),
            games_played=inventory.get("games_played", 0),
            badges=inventory.get("badges", []),
            dao_voting_power=inventory.get("dao_voting_power", 0),
            level=inventory.get("level", 1),
            xp=inventory.get("xp", 0)
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching player: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player")

@api_router.post("/badges", response_model=Badge)
async def mint_badge(badge_data: BadgeCreate, request: Request, db: Client = Depends(get_supabase)):
    """Mint a new badge for a player"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    badge = Badge(
        name=sanitize_string(badge_data.name, 50),
        description=sanitize_string(badge_data.description, 200),
        rarity=sanitize_string(badge_data.rarity, 20),
        game_id=sanitize_string(badge_data.game_id, 50),
        traits=badge_data.traits,
        icon=sanitize_string(badge_data.icon, 50)
    )
    
    try:
        response = db.table("game_stats").select("*").eq("user_id", badge_data.player_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Player not found")
        
        record = response.data[0]
        inventory = record.get("inventory", {})
        badges = inventory.get("badges", [])
        badges.append(badge.dict())
        inventory["badges"] = badges
        
        # Update DAO voting power
        voting_power_increase = 10 if badge_data.rarity == "Legendary" else 5 if badge_data.rarity == "Epic" else 2 if badge_data.rarity == "Rare" else 1
        inventory["dao_voting_power"] = inventory.get("dao_voting_power", 0) + voting_power_increase
        
        db.table("game_stats").update({"inventory": inventory}).eq("user_id", badge_data.player_id).execute()
        
        return badge
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error minting badge: {e}")
        raise HTTPException(status_code=500, detail="Failed to mint badge")

@api_router.get("/badges/{player_id}", response_model=List[Badge])
async def get_player_badges(player_id: str, db: Client = Depends(get_supabase)):
    """Get all badges for a player"""
    try:
        response = db.table("game_stats").select("inventory").eq("user_id", player_id).execute()
        
        if not response.data:
            return []
        
        inventory = response.data[0].get("inventory", {})
        return inventory.get("badges", [])
    except Exception as e:
        logging.error(f"Error fetching badges: {e}")
        return []

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, request: Request, db: Client = Depends(get_supabase)):
    """Register a new user with email and password"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    clean_username = sanitize_username(user_data.username)
    clean_email = user_data.email.lower().strip()
    
    if not clean_username or len(clean_username) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 alphanumeric characters")
    
    try:
        # Optimized: Check email separately with database filtering
        # Note: Supabase JSONB filtering syntax for inventory->>'email'
        email_check = db.table("game_stats").select("user_id").limit(1).execute()
        
        # Since Supabase free tier doesn't support JSONB arrow operator filtering well,
        # we'll do a limited query and check in memory (for small user bases this is fine)
        # For production with large user bases, consider adding a separate 'email' column
        existing = db.table("game_stats").select("inventory").limit(1000).execute()
        for record in existing.data:
            inv = record.get("inventory", {})
            if inv.get("email") == clean_email:
                raise HTTPException(status_code=400, detail="Email already registered")
            if inv.get("username") == clean_username:
                raise HTTPException(status_code=400, detail="Username already taken")
        
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        created_at = datetime.utcnow().isoformat()
        
        user_inventory = {
            "email": clean_email,
            "username": clean_username,
            "password_hash": hashed_password,
            "created_at": created_at,
            "auth_provider": "email",
            "avatar_id": None,
            "high_scores": {},
            "total_xp": 0,
            "level": 1,
            "badges": [],
            "dao_voting_power": 0,
            "unlocked_story_badges": [],
            "achievements": [],
            "games_played": 0,
            "total_score": 0,
            "recent_scores": [],
            "faction_id": None,
            "faction_joined_at": None,
            "faction_xp_contributed": 0,
            "faction_votes_participated": 0,
            "faction_member_rank": "Rookie",
            "faction_votes": {}
        }
        
        db.table("game_stats").insert({
            "user_id": user_id,
            "score": 0,
            "inventory": user_inventory,
            "last_played": created_at
        }).execute()
        
        access_token = create_access_token(data={"sub": user_id})
        
        # Build user response without password
        user_response = {k: v for k, v in user_inventory.items() if k != "password_hash"}
        user_response["id"] = user_id
        
        return TokenResponse(access_token=access_token, user=user_response)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user")

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request, db: Client = Depends(get_supabase)):
    """Login with email and password"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
    try:
        # Optimized: Limit query to reasonable number of records
        # For production, add a proper email index/column
        response = db.table("game_stats").select("user_id,inventory,score,last_played").limit(1000).execute()
        
        user_record = None
        for record in response.data:
            inv = record.get("inventory", {})
            if inv.get("email") == credentials.email.lower():
                user_record = record
                break
        
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        inventory = user_record.get("inventory", {})
        
        if not inventory.get("password_hash"):
            raise HTTPException(status_code=401, detail="Please use Google Sign-In for this account")
        
        if not verify_password(credentials.password, inventory["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token = create_access_token(data={"sub": user_record["user_id"]})
        
        # Build user response without password
        user_response = {k: v for k, v in inventory.items() if k != "password_hash"}
        user_response["id"] = user_record["user_id"]
        
        return TokenResponse(access_token=access_token, user=user_response)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail="Failed to login")

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest, request: Request, db: Client = Depends(get_supabase)):
    """Authenticate with Google ID token"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={auth_request.id_token}"
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_user = response.json()
            email = google_user.get("email")
            raw_name = google_user.get("name", email.split("@")[0])
            name = sanitize_string(raw_name, 50)
            
            if not email:
                raise HTTPException(status_code=401, detail="Email not provided by Google")
        
        # Check if user exists
        existing_response = db.table("game_stats").select("*").execute()
        existing_user = None
        for record in existing_response.data:
            if record.get("inventory", {}).get("email") == email.lower():
                existing_user = record
                break
        
        if existing_user:
            # Update last login
            inventory = existing_user.get("inventory", {})
            inventory["last_login"] = datetime.utcnow().isoformat()
            db.table("game_stats").update({
                "inventory": inventory,
                "last_played": datetime.utcnow().isoformat()
            }).eq("user_id", existing_user["user_id"]).execute()
            
            user_id = existing_user["user_id"]
            user_inventory = inventory
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            user_inventory = {
                "email": email.lower(),
                "username": name,
                "password_hash": None,
                "created_at": created_at,
                "auth_provider": "google",
                "google_id": google_user.get("sub"),
                "avatar_id": None,
                "high_scores": {},
                "total_xp": 0,
                "level": 1,
                "badges": [],
                "dao_voting_power": 0,
                "unlocked_story_badges": [],
                "achievements": [],
                "games_played": 0,
                "total_score": 0,
                "recent_scores": [],
                "faction_id": None,
                "faction_joined_at": None,
                "faction_xp_contributed": 0,
                "faction_votes_participated": 0,
                "faction_member_rank": "Rookie",
                "faction_votes": {}
            }
            
            db.table("game_stats").insert({
                "user_id": user_id,
                "score": 0,
                "inventory": user_inventory,
                "last_played": created_at
            }).execute()
        
        access_token = create_access_token(data={"sub": user_id})
        
        user_response = {k: v for k, v in user_inventory.items() if k != "password_hash"}
        user_response["id"] = user_id
        
        return TokenResponse(access_token=access_token, user=user_response)
        
    except HTTPException:
        raise
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to verify Google token")
    except Exception as e:
        logging.error(f"Error with Google auth: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# Google OAuth Session endpoint (for Emergent Auth)
class GoogleSessionRequest(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

@api_router.post("/auth/google-session", response_model=TokenResponse)
async def google_session_auth(session_data: GoogleSessionRequest, request: Request, db: Client = Depends(get_supabase)):
    """Authenticate with Google session from Emergent Auth"""
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    email = session_data.email.lower()
    sanitized_name = sanitize_string(session_data.name, 50)
    
    try:
        # Check if user exists
        existing_response = db.table("game_stats").select("*").execute()
        existing_user = None
        for record in existing_response.data:
            if record.get("inventory", {}).get("email") == email:
                existing_user = record
                break
        
        if existing_user:
            inventory = existing_user.get("inventory", {})
            inventory["last_login"] = datetime.utcnow().isoformat()
            db.table("game_stats").update({
                "inventory": inventory,
                "last_played": datetime.utcnow().isoformat()
            }).eq("user_id", existing_user["user_id"]).execute()
            
            user_id = existing_user["user_id"]
            user_inventory = inventory
        else:
            user_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            user_inventory = {
                "email": email,
                "username": sanitized_name,
                "password_hash": None,
                "created_at": created_at,
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
                "achievements": [],
                "games_played": 0,
                "total_score": 0,
                "recent_scores": [],
                "faction_id": None,
                "faction_joined_at": None,
                "faction_xp_contributed": 0,
                "faction_votes_participated": 0,
                "faction_member_rank": "Rookie",
                "faction_votes": {}
            }
            
            db.table("game_stats").insert({
                "user_id": user_id,
                "score": 0,
                "inventory": user_inventory,
                "last_played": created_at
            }).execute()
        
        access_token = create_access_token(data={"sub": user_id})
        
        user_response = {k: v for k, v in user_inventory.items() if k != "password_hash"}
        user_response["id"] = user_id
        
        return TokenResponse(access_token=access_token, user=user_response)
    except Exception as e:
        logging.error(f"Error with Google session auth: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(user = Depends(get_current_user)):
    """Get current logged-in user's profile"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserResponse(
        id=user.get("id", user.get("user_id", "")),
        email=user.get("email", ""),
        username=user.get("username", ""),
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
        recent_scores=user.get("recent_scores", []),
        faction_id=user.get("faction_id"),
        faction_joined_at=user.get("faction_joined_at"),
        faction_xp_contributed=user.get("faction_xp_contributed", 0),
        faction_votes_participated=user.get("faction_votes_participated", 0),
        faction_member_rank=user.get("faction_member_rank", "Rookie"),
        faction_votes=user.get("faction_votes", {})
    )

@api_router.put("/auth/sync", response_model=UserResponse)
async def sync_profile(profile_data: SyncProfileRequest, request: Request, user = Depends(get_current_user), db: Client = Depends(get_supabase)):
    """Sync local profile data to cloud - MERGES data, keeping best values"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get("id", user.get("user_id"))
    
    try:
        # Get existing data
        response = db.table("game_stats").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        record = response.data[0]
        existing_inventory = record.get("inventory", {})
        
        # Merge high scores - keep the HIGHER score for each game
        existing_high_scores = existing_inventory.get("high_scores", {})
        merged_high_scores = {**existing_high_scores}
        for game_id, score in profile_data.high_scores.items():
            if score > merged_high_scores.get(game_id, 0):
                merged_high_scores[game_id] = score
        
        # Merge badges - keep all unique badges
        existing_badges = existing_inventory.get("badges", [])
        existing_badge_ids = {b.get('id') or b.get('name') for b in existing_badges}
        merged_badges = existing_badges.copy()
        for badge in profile_data.badges:
            badge_id = badge.get('id') or badge.get('name')
            if badge_id and badge_id not in existing_badge_ids:
                merged_badges.append(badge)
                existing_badge_ids.add(badge_id)
        
        # Merge story badges and achievements
        existing_story_badges = existing_inventory.get("unlocked_story_badges", [])
        merged_story_badges = list(set(existing_story_badges + profile_data.unlocked_story_badges))
        
        existing_achievements = existing_inventory.get("achievements", [])
        merged_achievements = list(set(existing_achievements + profile_data.achievements))
        
        # Take the HIGHER values for numeric fields
        merged_xp = max(existing_inventory.get("total_xp", 0), profile_data.total_xp)
        merged_level = max(existing_inventory.get("level", 1), profile_data.level)
        merged_voting_power = max(existing_inventory.get("dao_voting_power", 0), profile_data.dao_voting_power)
        merged_games_played = max(existing_inventory.get("games_played", 0), profile_data.games_played)
        merged_total_score = max(existing_inventory.get("total_score", 0), profile_data.total_score)
        
        # Merge recent scores
        existing_recent = existing_inventory.get("recent_scores", [])
        merged_recent = profile_data.recent_scores + existing_recent
        seen_times = set()
        unique_recent = []
        for score in merged_recent:
            score_time = score.get('playedAt', 0)
            if score_time not in seen_times:
                seen_times.add(score_time)
                unique_recent.append(score)
        merged_recent_scores = sorted(unique_recent, key=lambda x: x.get('playedAt', 0), reverse=True)[:20]
        
        # Merge faction data
        existing_faction = existing_inventory.get("faction_id")
        merged_faction_id = profile_data.faction_id or existing_faction
        merged_faction_joined = profile_data.faction_joined_at or existing_inventory.get("faction_joined_at")
        merged_faction_xp = max(existing_inventory.get("faction_xp_contributed", 0), profile_data.faction_xp_contributed)
        merged_faction_votes = max(existing_inventory.get("faction_votes_participated", 0), profile_data.faction_votes_participated)
        
        existing_faction_votes = existing_inventory.get("faction_votes", {})
        merged_faction_vote_records = {**existing_faction_votes, **profile_data.faction_votes}
        
        def get_member_rank(xp: int) -> str:
            if xp >= 10000: return "Legend"
            if xp >= 5000: return "Champion"
            if xp >= 2000: return "Elder"
            if xp >= 500: return "Member"
            return "Rookie"
        
        merged_faction_rank = get_member_rank(merged_faction_xp)
        
        # Update inventory
        updated_inventory = {
            **existing_inventory,
            "high_scores": merged_high_scores,
            "total_xp": merged_xp,
            "level": merged_level,
            "badges": merged_badges,
            "avatar_id": profile_data.avatar_id or existing_inventory.get("avatar_id"),
            "dao_voting_power": merged_voting_power,
            "unlocked_story_badges": merged_story_badges,
            "achievements": merged_achievements,
            "games_played": merged_games_played,
            "total_score": merged_total_score,
            "recent_scores": merged_recent_scores,
            "faction_id": merged_faction_id,
            "faction_joined_at": merged_faction_joined,
            "faction_xp_contributed": merged_faction_xp,
            "faction_votes_participated": merged_faction_votes,
            "faction_member_rank": merged_faction_rank,
            "faction_votes": merged_faction_vote_records,
            "last_sync": datetime.utcnow().isoformat()
        }
        
        db.table("game_stats").update({
            "score": merged_total_score,
            "inventory": updated_inventory,
            "last_played": datetime.utcnow().isoformat()
        }).eq("user_id", user_id).execute()
        
        return UserResponse(
            id=user_id,
            email=updated_inventory.get("email", ""),
            username=updated_inventory.get("username", ""),
            created_at=updated_inventory.get("created_at", ""),
            avatar_id=updated_inventory.get("avatar_id"),
            high_scores=updated_inventory.get("high_scores", {}),
            total_xp=updated_inventory.get("total_xp", 0),
            level=updated_inventory.get("level", 1),
            badges=updated_inventory.get("badges", []),
            dao_voting_power=updated_inventory.get("dao_voting_power", 0),
            unlocked_story_badges=updated_inventory.get("unlocked_story_badges", []),
            achievements=updated_inventory.get("achievements", []),
            games_played=updated_inventory.get("games_played", 0),
            total_score=updated_inventory.get("total_score", 0),
            recent_scores=updated_inventory.get("recent_scores", []),
            faction_id=updated_inventory.get("faction_id"),
            faction_joined_at=updated_inventory.get("faction_joined_at"),
            faction_xp_contributed=updated_inventory.get("faction_xp_contributed", 0),
            faction_votes_participated=updated_inventory.get("faction_votes_participated", 0),
            faction_member_rank=updated_inventory.get("faction_member_rank", "Rookie"),
            faction_votes=updated_inventory.get("faction_votes", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error syncing profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync profile")

# ================== GAME STATS ROUTES ==================

@api_router.get("/stats/games")
async def get_game_stats(db: Client = Depends(get_supabase)):
    """Get statistics for all games"""
    try:
        response = db.table("game_stats").select("*").execute()
        
        game_stats = {}
        for record in response.data:
            inventory = record.get("inventory", {})
            high_scores = inventory.get("high_scores", {})
            
            for game_id, score in high_scores.items():
                if game_id not in game_stats:
                    game_stats[game_id] = {
                        "total_plays": 0,
                        "total_score": 0,
                        "max_score": 0,
                        "scores": []
                    }
                game_stats[game_id]["total_plays"] += 1
                game_stats[game_id]["total_score"] += score
                game_stats[game_id]["scores"].append(score)
                if score > game_stats[game_id]["max_score"]:
                    game_stats[game_id]["max_score"] = score
        
        # Calculate averages
        for game_id in game_stats:
            scores = game_stats[game_id].pop("scores")
            game_stats[game_id]["avg_score"] = round(sum(scores) / len(scores), 2) if scores else 0
            game_stats[game_id]["total_duration"] = 0  # Not tracked per-game currently
        
        return game_stats
    except Exception as e:
        logging.error(f"Error fetching game stats: {e}")
        return {}

@api_router.get("/stats/global")
async def get_global_stats(db: Client = Depends(get_supabase)):
    """Get global arcade statistics"""
    try:
        response = db.table("game_stats").select("*").execute()
        
        total_players = len(response.data)
        total_games = 0
        total_badges = 0
        
        for record in response.data:
            inventory = record.get("inventory", {})
            total_games += inventory.get("games_played", 0)
            total_badges += len(inventory.get("badges", []))
        
        return {
            "total_players": total_players,
            "total_games_played": total_games,
            "total_badges_minted": total_badges
        }
    except Exception as e:
        logging.error(f"Error fetching global stats: {e}")
        return {
            "total_players": 0,
            "total_games_played": 0,
            "total_badges_minted": 0
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
