import logging
import base64
from io import BytesIO
from typing import List, Optional, Union, Dict, Any, Tuple
from PIL import Image
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from fastapi import HTTPException, status, UploadFile
from dotenv import load_dotenv
import os
from app.config.base import Settings, get_settings  # Import get_settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Service for handling Vertex AI image generation capabilities.."""

    def __init__(self):
        """Initialize Vertex AI with project and location."""
        settings = get_settings()
        self.project_id = settings.GCP_PROJECT_ID
        self.location = settings.GOOGLE_LOCATION

        logger.info(
            f"Initializing Vertex AI with project_id: {self.project_id}, location: {self.location}"
        )

        vertexai.init(project=self.project_id, location=self.location)
        self.default_model = "imagen-3.0-fast-generate-001"
        self.available_models = {
            "imagen-3.0-fast-generate-001": "Standard image generator (Imagen 3.0 Fast)",
            "imagen-3.0-generate-002": "Advanced image generator (Imagen 3.0)",
        }

    async def generate_image_from_text(
        self,
        prompt: str,
        model_name: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
    ) -> Tuple[str, bytes]:
        """Generate an image based on a text prompt."""
        try:
            model_name = model_name if model_name else self.default_model

            logger.info(
                f"Generating image with model: {model_name}, prompt: {prompt}, aspect_ratio: {aspect_ratio}"
            )

            model = ImageGenerationModel.from_pretrained(model_name)

            generation_kwargs = {
                "prompt": prompt,
                "number_of_images": 1,
                "language": "en",
                "safety_filter_level": "block_some",
                "person_generation": "dont_allow",
            }

            if aspect_ratio:
                generation_kwargs["aspect_ratio"] = aspect_ratio

            response = model.generate_images(**generation_kwargs)

            # The response structure is different - it has a .images attribute
            if not response or not hasattr(response, "images") or not response.images:
                raise ValueError("No images were generated")

            # Get the image bytes from the first image in the response
            image_data = response.images[0]._image_bytes

            # Create a simple text response
            text_response = f"Image generated with {model_name} based on your prompt."

            return text_response, image_data

        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image generation failed: {str(e)}",
            )

    async def edit_image(
        self,
        prompt: str,
        image_data: bytes,
        model_name: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
    ) -> Tuple[str, bytes]:
        """Edit an existing image based on a text prompt."""
        try:
            model_name = model_name if model_name else self.default_model

            logger.info(
                f"Editing image with model: {model_name}, prompt: {prompt}, aspect_ratio: {aspect_ratio}"
            )

            # Save the input image to a temporary BytesIO object
            input_image = BytesIO(image_data)

            # For Vertex AI, we would need to use a different API for image editing
            # Currently, direct image editing is not supported in the same way as with Gemini
            # This could be implemented when Vertex AI adds this capability

            # For now, we'll raise an exception for this unsupported feature
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Image editing is not currently implemented with Vertex AI. This feature will be added in a future update.",
            )

        except Exception as e:
            logger.error(f"Image editing error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image editing failed: {str(e)}",
            )
