"""Простые утилиты кеширования ответов в Redis."""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis

from .config import get_settings

settings = get_settings()
redis_client = aioredis.from_url(str(settings.redis_url), decode_responses=True)


async def get_cached_response(key: str) -> dict[str, Any] | None:
    payload = await redis_client.get(key)
    if not payload:
        return None
    return json.loads(payload)


async def set_cached_response(key: str, value: dict[str, Any]) -> None:
    await redis_client.set(key, json.dumps(value), ex=settings.cache_ttl_seconds)
