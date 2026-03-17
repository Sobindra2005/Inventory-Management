from fastapi import APIRouter

from app.db.mongo import get_database
from app.db.redis import get_redis

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    mongo_state = "connected" if get_database() is not None else "disconnected"
    redis_state = "connected" if get_redis() is not None else "disconnected"
    return {
        "status": "ok",
        "service": "backend",
        "mongo": mongo_state,
        "redis": redis_state,
    }
