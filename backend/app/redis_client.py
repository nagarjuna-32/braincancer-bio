"""
NeuroGen AI - Redis Client & Cache Manager
===========================================
Connects to Redis using REDIS_URL environment variable for production high-performance caching.
"""

import os
from typing import Optional, Any
import json

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

try:
    from redis import Redis
    redis_client: Optional[Redis] = Redis.from_url(REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

def get_redis():
    """Returns initialized Redis client or None if offline."""
    return redis_client

def redis_cache_get(key: str) -> Optional[Any]:
    """Retrieve JSON item from Redis cache."""
    if not redis_client:
        return None
    try:
        val = redis_client.get(key)
        if val:
            return json.loads(val)
    except Exception:
        pass
    return None

def redis_cache_set(key: str, data: Any, ttl_seconds: int = 21600):
    """Store JSON item in Redis cache with TTL."""
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl_seconds, json.dumps(data))
    except Exception:
        pass
