from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routes import router as api_router
from services.database import connect_to_mongo, close_mongo_connection
from services.cloudinary import setup_cloudinary
from services.ocr import init_ocr
import logging

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Application startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up backend application...")
    await connect_to_mongo()
    setup_cloudinary()
    init_ocr()

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down backend application...")
    await close_mongo_connection()

# Include Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the OCR Full-Stack API"}
