from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from enum import Enum


class AspectRatio(str, Enum):
    SQUARE = "1:1"
    PORTRAIT = "3:4"
    LANDSCAPE = "4:3"
    WIDESCREEN = "16:9"
    ULTRAWIDE = "21:9"


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for image generation")
    model_name: Optional[str] = Field(
        default=None,
        description="Model name to use for generation. If not provided, the default model will be used.",
    )
    aspect_ratio: Optional[AspectRatio] = Field(
        default=None, description="Desired aspect ratio for the generated image"
    )


class ImageEditRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt describing the edit to make")
    model_name: Optional[str] = Field(
        default=None,
        description="Model name to use for editing. If not provided, the default model will be used.",
    )
    aspect_ratio: Optional[AspectRatio] = Field(
        default=None, description="Desired aspect ratio for the edited image"
    )
    # Image data will be sent as multipart/form-data


class ImageResponse(BaseModel):
    text_response: str = Field(
        default="", description="Textual description or response"
    )
    image_id: str = Field(..., description="URL to access the generated image")
    content_type: str = Field(
        default="image/png", description="Content type of the image"
    )
