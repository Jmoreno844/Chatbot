from app.config.base import Settings


class DeploySettings(Settings):
    DEBUG: bool = False
    TITLE: str = "FastAPI Project - Cloud"
    POSTGRES_DB: str = "cloud_db"
    APP_ENV: str = "cloud"
    # Update with your actual deployed domain
    BACKEND_CORS_ORIGINS: list[str] = [
        "https://your-frontend-domain.com",
        "http://localhost:3000",  # Keep local for development
    ]


settings = DeploySettings()
