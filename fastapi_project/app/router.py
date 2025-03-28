from fastapi import APIRouter
from app.apps.chat import api as chat_api
from app.apps.rag.api import router as rag_router
from app.apps.image_generation.api import router as image_generation_router

# Main API router
api_router = APIRouter()


api_router.include_router(chat_api.router, tags=["chat"])
api_router.include_router(rag_router, tags=["rag"])
api_router.include_router(image_generation_router, tags=["image_generation"])
