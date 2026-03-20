from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory Management API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost", "http://localhost:3000"]

    MONGODB_URI: str

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379/0"

    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672//"
    CELERY_BROKER_URL: str = "amqp://guest:guest@rabbitmq:5672//"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    CELERY_REPORT_QUEUE: str = "report_generation"

    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    REPORT_STORAGE_DIR: str = "/app/generated_reports"
    WS_EVENTS_CHANNEL: str = "realtime_events"

    JWT_SECRET: str
    JWT_ACCESS_EXPIRATION: str = "15m"
    JWT_REFRESH_EXPIRATION: str = "29d"

    PUBLIC_KEY: str
    CLERK_JWT_ALGORITHM: str = "RS256"
    CLERK_JWT_AUDIENCE: str | None = None

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
