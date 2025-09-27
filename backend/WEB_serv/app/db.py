"""Асинхронные подключения к PostgreSQL и Redis."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
import redis.asyncio as aioredis

from .config import get_settings

_settings = get_settings()

engine: AsyncEngine = create_async_engine(str(_settings.postgres_dsn), echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
redis_client = aioredis.from_url(str(_settings.redis_url), decode_responses=True)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Зависимость FastAPI для работы с БД."""

    async with SessionLocal() as session:
        yield session


async def shutdown() -> None:
    """Корректно закрывает соединения при остановке приложения."""

    await redis_client.close()
    await engine.dispose()
