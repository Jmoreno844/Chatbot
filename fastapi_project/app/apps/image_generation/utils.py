import base64
from io import BytesIO
from typing import Tuple, Dict, Optional
from PIL import Image
import time
from datetime import datetime, timedelta
import asyncio
import logging


def process_image_upload(image_data: bytes) -> bytes:
    """Process uploaded image data for model input."""
    # Optionally resize or optimize the image before sending to API
    image = Image.open(BytesIO(image_data))

    # If image is too large, resize it
    max_size = 1024
    if image.width > max_size or image.height > max_size:
        image.thumbnail((max_size, max_size))

    # Convert back to bytes in PNG format
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def encode_image_to_base64(image_data: bytes) -> str:
    """Encode image data to base64 string."""
    return base64.b64encode(image_data).decode("utf-8")


def get_image_dimensions(image_data: bytes) -> Tuple[int, int]:
    """Get the dimensions of an image from binary data."""
    image = Image.open(BytesIO(image_data))
    return image.width, image.height


class InMemoryImageStore:
    """Store images in memory with automatic expiration."""

    def __init__(self, expiration_seconds: int = 120):  # Default: 2 minutes
        self.images: Dict[str, Dict] = {}
        self.expiration_seconds = expiration_seconds
        self.logger = logging.getLogger(__name__)

    def add_image(
        self, image_id: str, image_data: bytes, content_type: str = "image/png"
    ) -> None:
        """Add an image to the in-memory store."""
        current_time = time.time()
        self.images[image_id] = {
            "data": image_data,
            "content_type": content_type,
            "created_at": current_time,
            "last_accessed": current_time,
        }

    def get_image(self, image_id: str) -> Optional[Tuple[bytes, str]]:
        """Retrieve an image from the store and update its last access time."""
        image_info = self.images.get(image_id)
        if not image_info:
            return None

        # Update last accessed time
        image_info["last_accessed"] = time.time()
        return image_info["data"], image_info["content_type"]

    def remove_image(self, image_id: str) -> bool:
        """Remove an image from the store."""
        if image_id in self.images:
            del self.images[image_id]
            return True
        return False

    def cleanup_expired_images(self) -> int:
        """Remove expired images from memory. Returns count of removed images."""
        current_time = time.time()
        expired_ids = [
            img_id
            for img_id, info in self.images.items()
            if current_time - info["last_accessed"] > self.expiration_seconds
        ]

        for img_id in expired_ids:
            self.remove_image(img_id)

        if expired_ids:
            self.logger.info(
                f"Cleaned up {len(expired_ids)} expired images from memory"
            )

        return len(expired_ids)

    async def start_cleanup_task(self):
        """Start a background task to periodically clean up expired images."""
        while True:
            try:
                self.cleanup_expired_images()
            except Exception as e:
                self.logger.error(f"Error during image cleanup: {str(e)}")

            # Run cleanup every minute
            await asyncio.sleep(60)
