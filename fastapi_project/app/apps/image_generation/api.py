import os
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    Request,
    BackgroundTasks,
    Form,
    Query,
)
from fastapi.responses import Response
import uuid
from typing import Dict, Any, Optional
import asyncio

from app.apps.image_generation.services.image_generation_service import (
    ImageGenerationService,
)
from app.apps.image_generation.schemas import (
    ImageGenerationRequest,
    ImageEditRequest,
    ImageResponse,
    AspectRatio,
)
from app.apps.image_generation.utils import (
    process_image_upload,
    encode_image_to_base64,
    InMemoryImageStore,
)

router = APIRouter(tags=["images"])

# Create an in-memory image store
image_store = InMemoryImageStore(expiration_seconds=1800)  # 30 minutes expiration


def get_image_service(request: Request) -> ImageGenerationService:
    return request.app.state.image_generation_service


@router.post("/images/generate", response_model=ImageResponse)
async def generate_image(
    request: ImageGenerationRequest,
    background_tasks: BackgroundTasks,
    image_service: ImageGenerationService = Depends(get_image_service),
):
    """Generate an image from a text prompt."""
    try:
        # Extract aspect ratio value from enum if present
        aspect_ratio_value = (
            request.aspect_ratio.value if request.aspect_ratio else None
        )

        text_response, image_data = await image_service.generate_image_from_text(
            prompt=request.prompt,
            model_name=request.model_name,
            aspect_ratio=aspect_ratio_value,
        )

        # Store the image in memory with a unique ID
        image_id = str(uuid.uuid4())
        image_store.add_image(image_id, image_data, "image/png")

        return ImageResponse(
            text_response=text_response, image_id=image_id, content_type="image/png"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image generation failed: {str(e)}"
        )


@router.post("/images/edit", response_model=ImageResponse)
async def edit_image(
    prompt: str = Form(...),
    image: UploadFile = File(...),
    model_name: Optional[str] = Form(None),
    aspect_ratio: Optional[AspectRatio] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    image_service: ImageGenerationService = Depends(get_image_service),
):
    """Edit an existing image using a text prompt."""
    try:
        # Read and process the uploaded image
        image_data = await image.read()
        processed_image = process_image_upload(image_data)

        # Extract aspect ratio value from enum if present
        aspect_ratio_value = aspect_ratio.value if aspect_ratio else None

        # Send to Gemini for editing
        text_response, edited_image_data = await image_service.edit_image(
            prompt=prompt,
            image_data=processed_image,
            model_name=model_name,
            aspect_ratio=aspect_ratio_value,
        )

        # Store the edited image in memory with a unique ID
        image_id = str(uuid.uuid4())
        image_store.add_image(image_id, edited_image_data, "image/png")

        return ImageResponse(
            text_response=text_response, image_id=image_id, content_type="image/png"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image editing failed: {str(e)}")


@router.get("/images/view/{image_id}")
async def view_image(image_id: str):
    """Serve a generated image by its ID from memory."""
    image_result = image_store.get_image(image_id)

    if not image_result:
        raise HTTPException(status_code=404, detail="Image not found or expired")

    image_data, content_type = image_result
    return Response(content=image_data, media_type=content_type)


# Add a function to start the cleanup task on application startup
async def start_image_cleanup_task():
    """Start the background task for cleaning up expired images."""
    await image_store.start_cleanup_task()


# This function should be called from the main application startup
def setup_image_store(app):
    """Setup the image store with a cleanup task."""

    @app.on_event("startup")
    async def on_startup():
        # Start cleanup task as a background task
        asyncio.create_task(start_image_cleanup_task())
