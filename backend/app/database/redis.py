from typing import Optional
from redis.asyncio import Redis, from_url
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

redis_client: Optional[Redis] = None


async def init_redis() -> Optional[Redis]:
    """Initializes the Redis connection pool."""
    global redis_client
    try:
        redis_client = from_url(
            str(settings.REDIS_URL),
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5,
        )
        await redis_client.ping()
        logger.info("redis_connected", url=str(settings.REDIS_URL))
        return redis_client
    except Exception as e:
        logger.warning("redis_connection_failed", error=str(e))
        redis_client = None
        return None


async def close_redis() -> None:
    """Closes the Redis connection pool cleanly."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("redis_connection_closed")


async def get_redis() -> Optional[Redis]:
    """Dependency helper for retrieving the active Redis client."""
    return redis_client
