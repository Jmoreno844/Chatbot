from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.base import Settings

# Then import all models
from app.apps.accounts.model import User

settings = Settings()

engine = create_engine(str(settings.DATABASE_URI))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use the custom Base from app.db.base_model
from app.db.base_model import Base


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = ["Base", "User"]
