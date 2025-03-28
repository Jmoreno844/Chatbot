from app.config.base import Settings


class TestSettings(Settings):
    DEBUG: bool = True
    TITLE: str = "FastAPI Project - Test"
    POSTGRES_DB: str = "test_db"
    APP_ENV: str = "test"


settings = TestSettings()
