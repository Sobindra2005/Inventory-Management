from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

mongo_client: AsyncIOMotorClient | None = None
mongo_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global mongo_client, mongo_db
    mongo_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    await mongo_client.admin.command("ping")
    mongo_db = mongo_client.get_default_database()


async def close_mongo_connection() -> None:
    global mongo_client, mongo_db
    if mongo_client is not None:
        mongo_client.close()
    mongo_client = None
    mongo_db = None


def get_database() -> AsyncIOMotorDatabase | None:
    return mongo_db
