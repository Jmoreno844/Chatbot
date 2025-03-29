from typing import AsyncGenerator, List, Optional
import logging
from fastapi import HTTPException, status
import asyncio

logger = logging.getLogger(__name__)

system_instructions = "Eres un asistente "


class GeminiChatService:
    """Service for handling Gemini AI chat interactions through Google GenAI."""

    def __init__(self, genai_client):
        """Receive genai client from the outside (only one instance in the app)."""
        self.client = genai_client
        self.model = "gemini-2.0-flash-exp"
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
        ]

    def _format_history(self, history: List[dict]) -> List[dict]:
        """Format chat history for Gemini."""
        if not history:
            return []

        formatted_history = []
        for msg in history:
            # Handle both direct content and parts format
            if "parts" in msg:
                content = msg["parts"][0].get("text", "")
                role = msg.get("role")
            else:
                content = msg.get("content")
                role = msg.get("role")

            if content and role:
                formatted_msg = {
                    "role": "user" if role == "user" else "model",
                    "parts": [{"text": content}],
                }
                formatted_history.append(formatted_msg)
            else:
                logger.error(f"Invalid message format in history: {msg}")

        return formatted_history

    async def get_streaming_response(
        self, message: str, history: Optional[List[dict]] = None
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response with chat history."""
        try:
            formatted_history = self._format_history(history or [])

            # Add the current user message
            contents = formatted_history + [
                {"role": "user", "parts": [{"text": message}]}
            ]

            # Create config with system instruction
            generate_config = {
                "temperature": 0.6,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "system_instruction": system_instructions,
                "safety_settings": self.safety_settings,
            }

            # Log what we're sending to the API
            logger.debug(f"Sending to Gemini API - Contents: {contents}")
            logger.debug(f"Config: {generate_config}")

            # Use the generate_content_stream method as shown in the docs
            stream = self.client.models.generate_content_stream(
                model=self.model, contents=contents, config=generate_config
            )

            for chunk in stream:
                if hasattr(chunk, "text"):
                    yield chunk.text
                    await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI service error: {str(e)}",
            )
