from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Depends,
    status,
    APIRouter,
    Request,
)
from app.apps.chat.services.rag_chat_service import get_rag_streaming_response
from app.apps.chat.services.gemini_service import GeminiChatService
from app.apps.chat.schemas import (
    ChatMessage,
    ChatResponse,
    GenerateTextRequest,
    GenerateTextResponse,
)
from app.apps.rag.services.embedding_service import EmbeddingService
from app.apps.rag.utils.vector_store import CloudVectorStore
import os
from dotenv import load_dotenv
import asyncio
import json
from datetime import datetime
from starlette.websockets import WebSocketState
import logging
import sys

# Enhanced logger setup
logger = logging.getLogger(__name__)
# Force the logger to propagate to root logger

logger.propagate = True
# Add a handler directly to this logger for redundancy
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(handler)

# Load environment variables
load_dotenv()


def get_chat_service(request: Request) -> GeminiChatService:
    return request.app.state.chat_service


# Add new dependency functions
def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service


def get_vector_store(request: Request) -> CloudVectorStore:
    return request.app.state.vector_store


router = APIRouter()


@router.post("/generateText", response_model=GenerateTextResponse)
def generate_text_endpoint(
    request: Request,
    request_data: GenerateTextRequest,
    chat_service: GeminiChatService = Depends(get_chat_service),
):
    """Endpoint para generación de texto directo sin historial."""
    try:
        generated_text = chat_service.generate_text(request_data.prompt)
        return GenerateTextResponse(generated_text=generated_text)
    except Exception as e:
        print(f"Text generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en la generación de texto",
        )


@router.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for chat"""
    logger.info("WebSocket connection attempt")

    try:
        # Accept the connection
        await websocket.accept()
        logger.info("WebSocket connection accepted")

        chat_service = websocket.app.state.chat_service

        while True:
            data = await websocket.receive_json()
            message = data.get("message")
            history = data.get("history", [])

            if not isinstance(message, str):
                await websocket.send_json(
                    {"error": "Invalid message format", "code": "invalid_format"}
                )
                continue

            try:
                async for chunk in chat_service.get_streaming_response(
                    message, history
                ):
                    await websocket.send_json({"chunk": chunk, "done": False})
                await websocket.send_json({"chunk": "", "done": True})
            except Exception as e:
                print(f"Streaming error: {str(e)}")
                await websocket.send_json({"error": str(e), "code": "stream_error"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if not websocket.client_state == WebSocketState.DISCONNECTED:
            await websocket.close()
