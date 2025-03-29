from app.config.base import Settings


class DeploySettings(Settings):
    DEBUG: bool = False
    TITLE: str = "FastAPI Project - Cloud"
    POSTGRES_DB: str = "cloud_db"
    APP_ENV: str = "cloud"
    # Update with your actual deployed domain


settings = DeploySettings()
