from pydantic import BaseModel
from typing import Optional


class ErrorDetail(BaseModel):
    """Error detail model."""

    code: str
    message: str
    details: Optional[str] = None


class GeminiError(Exception):
    """Base exception for Gemini API errors."""

    def __init__(self, code: str, message: str, details: Optional[str] = None):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class SessionError(Exception):
    """Exception for session-related errors."""

    def __init__(self, code: str, message: str, details: Optional[str] = None):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)
