import os
import secrets
from typing import Any, Dict, List, Optional, Union
from functools import lru_cache

from pydantic import AnyHttpUrl, PostgresDsn, field_validator, ValidationInfo
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    DEBUG: bool = False
    TITLE: str = "FastAPI Project"

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_HOST: str  # Changed from POSTGRES_SERVER to match .env
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str

    # Application Database User
    DB_USER: str  # Added to match .env
    DB_PASSWORD: str  # Added to match .env
    DB_NAME: str  # Added to match .env

    DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info: ValidationInfo) -> Any:
        if isinstance(v, str):
            return v

        user = info.data.get("POSTGRES_USER")
        password = info.data.get("POSTGRES_PASSWORD")
        host = info.data.get("POSTGRES_HOST")  # Changed from POSTGRES_SERVER
        port = info.data.get("POSTGRES_PORT")
        db = info.data.get("POSTGRES_DB", "")

        # Construct PostgreSQL connection string
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    # Session configuration
    SESSION_EXPIRE_MINUTES: int = int(
        os.getenv("SESSION_EXPIRE_MINUTES", "1440")
    )  # 24 hours default

    # Gemini API settings
    GEMINI_API_KEY: str
    gemini_model: str = "gemini-2.0-flash-exp"

    # Storage
    GCS_PROJECT_ID: str
    GCS_BUCKET_NAME: str

    HF_TOKEN: Optional[str] = None
    # Chat settings
    default_voice: str = "Kore"  # Options: Aoede, Charon, Fenrir, Kore, Puck
    max_session_minutes: int = 14  # Set to 14 to be safe (limit is 15)

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()
