from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "OCR Full-Stack API"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017" # Replace with Atlas URI in prod
    MONGODB_DB_NAME: str = "ocr_db"
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "your_cloud_name"
    CLOUDINARY_API_KEY: str = "your_api_key"
    CLOUDINARY_API_SECRET: str = "your_api_secret"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
