import os
from functools import lru_cache
from typing import Dict, Type

from app.config.base import Settings
from app.config.develop import DevelopSettings
from app.config.test import DeploySettings  # Updated import

# Map environment names to settings classes
environment_settings: Dict[str, Type[Settings]] = {
    "development": DevelopSettings,
    "test": DeploySettings,  # For backward compatibility
    "cloud": DeploySettings,  # Add cloud environment
    "production": Settings,  # Use base settings for production
}


@lru_cache()
def get_settings():
    """
    Get cached settings instance based on environment.
    Using lru_cache for performance in repeated access.
    """
    # Get environment from ENV variable, default to development
    app_env = os.getenv("APP_ENV", "development").lower()

    # Select the appropriate settings class
    settings_class = environment_settings.get(app_env, DevelopSettings)

    print(f"Loading {app_env} settings...")

    # Create settings instance
    return settings_class()


# Provide direct access to settings for simpler imports
settings = get_settings()
