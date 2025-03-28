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
import logging

# Add these imports
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
    print(f"Starting application in {getattr(settings, 'APP_ENV', 'unknown')} mode")

    # Get environment variables for Google Cloud Storage
    BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "your-gcs-bucket-name")
    GCS_PROJECT_ID = os.getenv("GCS_PROJECT_ID", "your-gcs-project-id")

    # Initialize Gemini service
    gemini_api_key = settings.GEMINI_API_KEY
    genai_client = genai.Client(api_key=gemini_api_key)
    app.state.chat_service = GeminiChatService(genai_client)

    # Initialize RAG services
    app.state.embedding_service = EmbeddingService()
    app.state.vector_store = CloudVectorStore(
        bucket_name=BUCKET_NAME, project_id=GCS_PROJECT_ID
    )

    # Load embeddings from cloud storage
    app.state.vector_store.load_from_cloud()

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
