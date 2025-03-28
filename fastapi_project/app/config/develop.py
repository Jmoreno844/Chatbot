from app.config.base import Settings


class DevelopSettings(Settings):
    DEBUG: bool = True
    TITLE: str = "FastAPI Project - Development"
    APP_ENV: str = "development"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = DevelopSettings()
