from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Create async engine
engine = create_async_engine(
    str(settings.DATABASE_URI).replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """Dependency for getting async DB session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Keep the synchronous session for backward compatibility if needed
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker as sync_sessionmaker

sync_engine = create_engine(str(settings.DATABASE_URI))
SessionLocal = sync_sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_sync_db():
    """Dependency for getting synchronous DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
