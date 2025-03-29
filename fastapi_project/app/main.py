import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.apps.chat.services.gemini_service import GeminiChatService
from google import genai
from app.config import settings
from app.router import api_router
from app.config.base import Settings, get_settings  # Import settings
import logging

from app.apps.image_generation.services.image_generation_service import (
    ImageGenerationService,
)
from app.apps.image_generation.api import router as image_router, setup_image_store
from app.apps.rag.services.embedding_service import EmbeddingService
from app.apps.rag.utils.vector_store import CloudVectorStore
import os

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
    app_env = getattr(settings, "APP_ENV", "unknown")
    print(f"Starting application in {app_env} mode")
    logger.info(f"Application environment: {app_env}")

    # Get environment variables for Google Cloud Storage
    BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", settings.GCS_BUCKET_NAME)
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", settings.GCP_PROJECT_ID)

    logger.info(f"Initializing with GCP_PROJECT_ID: {GCP_PROJECT_ID}")
    logger.info(f"Using bucket: {BUCKET_NAME}")

    # Initialize Gemini service
    gemini_api_key = settings.GEMINI_API_KEY
    genai_client = genai.Client(api_key=gemini_api_key)
    app.state.chat_service = GeminiChatService(genai_client)

    # Initialize the image generation service with Vertex AI
    app.state.image_generation_service = (
        ImageGenerationService()
    )  # Initialize RAG services
    app.state.embedding_service = EmbeddingService()
    app.state.vector_store = CloudVectorStore(
        bucket_name=BUCKET_NAME, project_id=GCP_PROJECT_ID
    )

    # Load embeddings from cloud storage
    app.state.vector_store.load_from_cloud()

    # Setup image store with cleanup task
    setup_image_store(app)

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
    print(f"CORS origins from settings: {settings.BACKEND_CORS_ORIGINS}")

    # Create a more comprehensive list of allowed origins
    allowed_origins = []
    for origin in settings.BACKEND_CORS_ORIGINS:
        origin_str = str(origin)
        allowed_origins.append(origin_str)

        # Add version without trailing slash if it has one
        if origin_str.endswith("/"):
            allowed_origins.append(origin_str.rstrip("/"))
        # Add version with trailing slash if it doesn't have one
        else:
            allowed_origins.append(f"{origin_str}/")

        # Add version with explicit port 80 if it doesn't have a port
        if ":" not in origin_str:
            allowed_origins.append(f"{origin_str}:80")

    print(f"Expanded CORS origins: {allowed_origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    print("WARNING: No CORS origins configured")


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


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    # For local development only
    # In production, Gunicorn or Cloud Run will handle this
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
