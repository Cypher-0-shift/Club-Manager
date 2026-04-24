"""
Cache Service - Redis-based caching for frequently accessed data
"""
from typing import Optional, Any
import json
import redis.asyncio as redis
from app.core.config import settings
from loguru import logger

# Global Redis client
_redis_client: Optional[redis.Redis] = None


class CacheService:
    """
    Redis-based caching service.
    
    PHASE 2: Implements caching for frequently accessed endpoints like
    /domains and /users/permissions to reduce database load.
    """
    
    DEFAULT_TTL = 300  # 5 minutes
    
    @staticmethod
    async def get_client() -> redis.Redis:
        """Get or create Redis client."""
        global _redis_client
        if _redis_client is None:
            try:
                _redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD if hasattr(settings, 'REDIS_PASSWORD') else None,
                    db=settings.REDIS_DB if hasattr(settings, 'REDIS_DB') else 0,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    max_connections=20
                )
                # Test connection
                await _redis_client.ping()
                logger.info("Redis connection established")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Caching disabled.")
                _redis_client = None
        return _redis_client
    
    @staticmethod
    async def close_client():
        """Close Redis client."""
        global _redis_client
        if _redis_client is not None:
            await _redis_client.close()
            _redis_client = None
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value (deserialized from JSON) or None if not found
        """
        try:
            client = await CacheService.get_client()
            if client is None:
                return None
            
            value = await client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    @staticmethod
    async def set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache (will be serialized to JSON)
            ttl: Time to live in seconds (default: 5 minutes)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await CacheService.get_client()
            if client is None:
                return False
            
            serialized = json.dumps(value, default=str)
            await client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    @staticmethod
    async def delete(key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await CacheService.get_client()
            if client is None:
                return False
            
            await client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    @staticmethod
    async def invalidate_pattern(pattern: str) -> int:
        """
        Invalidate all keys matching a pattern.
        
        Args:
            pattern: Redis key pattern (e.g., "domains:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            client = await CacheService.get_client()
            if client is None:
                return 0
            
            keys = []
            async for key in client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache invalidate pattern error for {pattern}: {e}")
            return 0
    
    # ═══════════════════════════════════════════════════════════
    # Convenience methods for common cache keys
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    async def get_domains() -> Optional[list]:
        """Get cached domains list."""
        return await CacheService.get("domains:all")
    
    @staticmethod
    async def set_domains(domains: list, ttl: int = DEFAULT_TTL) -> bool:
        """Cache domains list."""
        return await CacheService.set("domains:all", domains, ttl)
    
    @staticmethod
    async def invalidate_domains():
        """Invalidate all domain caches."""
        await CacheService.delete("domains:all")
    
    @staticmethod
    async def get_permissions() -> Optional[list]:
        """Get cached permissions matrix."""
        return await CacheService.get("permissions:matrix")
    
    @staticmethod
    async def set_permissions(permissions: list, ttl: int = DEFAULT_TTL) -> bool:
        """Cache permissions matrix."""
        return await CacheService.set("permissions:matrix", permissions, ttl)
    
    @staticmethod
    async def invalidate_permissions():
        """Invalidate permissions cache."""
        await CacheService.delete("permissions:matrix")
