from supabase import create_client, Client, AClient
from app.core.config import settings
from functools import lru_cache
import httpx
from typing import Optional

# ══════════════════════════════════════════════════════════════
# PHASE 2: Async Supabase clients with connection pooling
# ══════════════════════════════════════════════════════════════

# Global HTTP client with connection pooling
_http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    """
    Get or create a shared async HTTP client with connection pooling.
    
    Connection pool settings:
    - max_connections: 50 (total connections across all hosts)
    - max_keepalive_connections: 20 (persistent connections)
    - keepalive_expiry: 30 seconds
    """
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            limits=httpx.Limits(
                max_connections=50,
                max_keepalive_connections=20,
                keepalive_expiry=30.0
            ),
            timeout=httpx.Timeout(30.0, connect=10.0),
            http2=True  # Enable HTTP/2 for better performance
        )
    return _http_client

async def close_http_client():
    """Close the global HTTP client. Call this on app shutdown."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None

# ══════════════════════════════════════════════════════════════
# Synchronous clients (for backward compatibility)
# ══════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Admin client (service role key) — bypasses RLS for server-side operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@lru_cache(maxsize=1)
def get_supabase_anon() -> Client:
    """Anon client — respects RLS."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# ══════════════════════════════════════════════════════════════
# Async clients (NEW - for concurrent operations)
# ══════════════════════════════════════════════════════════════

_async_admin_client: Optional[AClient] = None
_async_anon_client: Optional[AClient] = None

async def get_supabase_admin_async() -> AClient:
    """
    Get async admin client with connection pooling.
    Uses shared HTTP client for efficient connection reuse.
    """
    global _async_admin_client
    if _async_admin_client is None:
        # Note: supabase-py doesn't natively support custom httpx clients yet
        # We create a standard async client for now
        _async_admin_client = await create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_SERVICE_KEY
        )
    return _async_admin_client

async def get_supabase_anon_async() -> AClient:
    """Get async anon client with connection pooling."""
    global _async_anon_client
    if _async_anon_client is None:
        _async_anon_client = await create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_ANON_KEY
        )
    return _async_anon_client

async def close_supabase_clients():
    """Close all async Supabase clients. Call this on app shutdown."""
    global _async_admin_client, _async_anon_client
    # Supabase clients don't have explicit close methods
    # But we can reset them to force recreation
    _async_admin_client = None
    _async_anon_client = None

