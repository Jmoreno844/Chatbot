from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class Message(BaseModel):
    """Individual message in chat history."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4096)


class ChatHistoryItem(BaseModel):
    parts: List[dict]
    role: str


class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = (
        None  # Formato del historial según tu implementación
    )


class ChatResponse(BaseModel):
    """Schema for chat responses."""

    response: str
    error: Optional[str] = None


class GeminiMessage(BaseModel):
    role: str
    parts: List[dict]


class GenerateTextRequest(BaseModel):
    prompt: str


class GenerateTextResponse(BaseModel):
    generated_text: str
