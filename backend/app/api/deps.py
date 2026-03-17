from app.db.mongo import get_database
from app.db.redis import get_redis


def get_mongo_db():
    return get_database()


def get_redis_client():
    return get_redis()
