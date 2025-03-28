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

from app.db.session import get_db
from app.apps.chat.services.gemini_service import GeminiChatService
from app.apps.chat.schemas import (
    ChatMessage,
    ChatResponse,
    GenerateTextRequest,
    GenerateTextResponse,
)
import os
from dotenv import load_dotenv
import asyncio
from sqlalchemy.orm import Session
from app.core.security import (
    get_current_user,
    SESSION_USER_ID_KEY,
    extract_token_from_websocket,
    decode_jwt_token,
)
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


router = APIRouter()


@router.post("/generateText", response_model=GenerateTextResponse)
def generate_text_endpoint(
    request: Request,  # Add request parameter
    request_data: GenerateTextRequest,
    chat_service: GeminiChatService = Depends(get_chat_service),
    current_user=Depends(get_current_user),  # Use your get_current_user
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


async def get_current_user_ws(websocket: WebSocket) -> dict:
    """Authenticate WebSocket connections using JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        # Extract JWT token from query parameters
        token = await extract_token_from_websocket(websocket)
        logger.info(f"Extracted token: {token[:10]}...")  # Log first part of token

        # Validate the token
        user_data = decode_jwt_token(token)
        logger.info(f"WebSocket authenticated user: {user_data}")
        return user_data
    except HTTPException as e:
        logger.error(f"WebSocket authentication error: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected WebSocket authentication error: {str(e)}")
        raise credentials_exception


@router.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for chat with token-based authentication"""
    logger.info("WebSocket connection attempt")
    logger.info(f"Query params: {websocket.query_params}")

    try:
        # Accept the connection first to be able to send error messages
        await websocket.accept()

        # Authenticate using token
        try:
            current_user = await get_current_user_ws(websocket)
            logger.info(f"User authenticated: {current_user.get('user_id')}")

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

        except HTTPException as e:
            logger.error(f"Authentication failed: {e.detail}")
            await websocket.send_json({"error": e.detail, "code": e.status_code})
            await websocket.close(code=1008)  # Policy violation
            return

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if not websocket.client_state == WebSocketState.DISCONNECTED:
            await websocket.close()


@router.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    logger.info("Health check endpoint called")
    return {"status": "healthy"}
