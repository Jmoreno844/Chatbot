from fastapi import APIRouter
from app.apps.chat import api as chat_api
from app.apps.rag.api import router as rag_router

# Main API router
api_router = APIRouter()


api_router.include_router(chat_api.router, tags=["chat"])
api_router.include_router(rag_router, tags=["rag"])
