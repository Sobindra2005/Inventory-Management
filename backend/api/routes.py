from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from models.schemas import BillResponse
from services.cloudinary import upload_image_to_cloudinary
from services.ocr import extract_text_from_image_bytes
from services.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload-bill", response_model=BillResponse)
async def upload_bill(file: UploadFile = File(...), db=Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # 1. Upload to Cloudinary
        logger.info(f"Uploading {file.filename} to Cloudinary...")
        image_url = await upload_image_to_cloudinary(file_bytes, file.filename)
        
        # 2. Extract Text with PaddleOCR
        logger.info(f"Extracting text from {file.filename}...")
        extracted_text = await extract_text_from_image_bytes(file_bytes)
        
        # 3. Save to MongoDB
        logger.info(f"Saving {file.filename} data to MongoDB...")
        document = {
            "filename": file.filename,
            "cloudinary_url": image_url,
            "extracted_text": extracted_text,
            "status": "success"
        }
        
        if db is not None:
            # We insert into the 'bills' collection
            result = await db["bills"].insert_one(document)
            document["id"] = str(result.inserted_id)
        else:
            logger.warning("MongoDB database explicitly None; skipping save.")
            document["id"] = "not_saved"
        
        return BillResponse(
            id=document["id"],
            filename=document["filename"],
            cloudinary_url=document["cloudinary_url"],
            extracted_text=document["extracted_text"],
            status=document["status"]
        )

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
