import redis.asyncio as redis

from app.core.config import settings

redis_client: redis.Redis | None = None


async def connect_to_redis() -> None:
    global redis_client
    redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, decode_responses=True)
    await redis_client.ping()


async def close_redis_connection() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.close()
    redis_client = None


def get_redis() -> redis.Redis | None:
    return redis_client
