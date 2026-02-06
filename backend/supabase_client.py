import os
import logging
from fastapi import HTTPException
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    logging.warning("Supabase credentials not found. Database operations will fail.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def get_supabase() -> Client:
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    return supabase
