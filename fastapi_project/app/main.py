import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware
from app.apps.chat.services.gemini_service import GeminiChatService
from google import genai
from app.config import settings
from app.router import api_router
from app.apps.accounts.api import router as accounts_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.info("Test log: Application is starting")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events
    Preferred over @app.on_event decorators
    """
    # Startup logic
    print(f"Starting application in {getattr(settings, 'APP_ENV', 'unknown')} mode")

    # Instantiate your GenaiClient as needed
    gemini_api_key = settings.GEMINI_API_KEY
    genai_client = genai.Client(api_key=gemini_api_key)
    app.state.chat_service = GeminiChatService(genai_client)

    # Create database tables (for sync SQLAlchemy)
    # from app.db.base_model import Base
    # from app.db.session import sync_engine
    # Base.metadata.create_all(bind=sync_engine)

    yield

    # Shutdown logic
    print("Shutting down application")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title=getattr(settings, "TITLE", "FastAPI Project"),
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    debug=getattr(settings, "DEBUG", False),
    lifespan=lifespan,
)


# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    max_age=settings.SESSION_EXPIRE_MINUTES * 60,  # Convert to seconds
    same_site="lax",
    https_only=not settings.DEBUG,  # True in production
)


# Global exception handler
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Log the error here if needed
    return await http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log unhandled exceptions
    import traceback

    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include main router
app.include_router(api_router, prefix=settings.API_PREFIX)
# Include chat router
app.include_router(accounts_router)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}
