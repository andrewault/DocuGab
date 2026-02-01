"""Redis cache service for frequently accessed data."""

import json
from typing import Any, Optional

from redis.asyncio import Redis

from app.core.config import settings


class CacheService:
    """Async Redis cache service."""

    def __init__(self):
        self.redis: Optional[Redis] = None

    async def connect(self):
        """Connect to Redis."""
        if not self.redis:
            self.redis = Redis.from_url(settings.redis_url, decode_responses=True)

    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.aclose()
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis:
            await self.connect()
        value = await self.redis.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL in seconds."""
        if not self.redis:
            await self.connect()
        await self.redis.setex(key, ttl, json.dumps(value, default=str))

    async def delete(self, key: str):
        """Delete key from cache."""
        if not self.redis:
            await self.connect()
        await self.redis.delete(key)

    async def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern."""
        if not self.redis:
            await self.connect()
        async for key in self.redis.scan_iter(match=pattern):
            await self.redis.delete(key)


# Global cache instance
cache = CacheService()
