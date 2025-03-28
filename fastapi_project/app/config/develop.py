from app.config.base import Settings


class DevelopSettings(Settings):
    DEBUG: bool = True
    TITLE: str = "FastAPI Project - Development"
    APP_ENV: str = "development"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    SECRET_KEY: str = "your-secret-key-here"  # Change this to a secure random string
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    SESSION_EXPIRE_MINUTES: int = 60


settings = DevelopSettings()
