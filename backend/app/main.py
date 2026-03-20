from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.middleware import ClerkAuthMiddleware
from app.db.mongo import close_mongo_connection, connect_to_mongo
from app.db.redis import close_redis_connection, connect_to_redis
from app.services.realtime import listen_for_realtime_events
from app.services.cloudinary_service import setup_cloudinary
import logging

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    realtime_stop_event = asyncio.Event()
    realtime_listener_task: asyncio.Task | None = None

    await connect_to_mongo()
    await connect_to_redis()
    setup_cloudinary()

    realtime_listener_task = asyncio.create_task(listen_for_realtime_events(realtime_stop_event))

    yield

    realtime_stop_event.set()
    if realtime_listener_task is not None:
        await asyncio.gather(realtime_listener_task, return_exceptions=True)

    await close_redis_connection()
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(ClerkAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {"message": f"{settings.PROJECT_NAME} is running"}
