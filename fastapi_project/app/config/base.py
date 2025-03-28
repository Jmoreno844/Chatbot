import os
import secrets
from typing import Any, Dict, List, Optional, Union
from functools import lru_cache

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"
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
