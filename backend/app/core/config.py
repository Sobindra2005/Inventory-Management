from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory Management API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost", "http://localhost:3000"]

    MONGODB_URI: str

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    JWT_SECRET: str
    JWT_ACCESS_EXPIRATION: str = "15m"
    JWT_REFRESH_EXPIRATION: str = "29d"

    CLERK_JWT_KEY: str
    CLERK_JWT_ALGORITHM: str = "HS256"
    CLERK_JWT_AUDIENCE: str | None = None

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
