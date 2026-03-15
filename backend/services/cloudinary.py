import cloudinary
import cloudinary.uploader
import logging
from core.config import settings

logger = logging.getLogger(__name__)

def setup_cloudinary():
    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        logger.info("Cloudinary configured successfully.")
    except Exception as e:
        logger.error(f"Error configuring Cloudinary: {e}")

async def upload_image_to_cloudinary(file_content: bytes, filename: str) -> str:
    """Uploads an image to cloudinary and returns the secure URL."""
    try:
        # We use a synchronous call in an async wrapper if necessary, 
        # but cloudinary uploader works directly
        response = cloudinary.uploader.upload(file_content, filename=filename)
        return response.get("secure_url")
    except Exception as e:
        logger.error(f"Failed to upload to Cloudinary: {e}")
        raise e
