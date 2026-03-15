from paddleocr import PaddleOCR
import logging
import asyncio
import numpy as np
import cv2

logger = logging.getLogger(__name__)

# Initialize PaddleOCR
# use_angle_cls=True allows identifying image orientation
# lang='en' specifies english language
ocr_engine = None

def init_ocr():
    global ocr_engine
    try:
        logger.info("Initializing PaddleOCR...")
        ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False) # Switch use_gpu=True if GPU available
        logger.info("PaddleOCR initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize PaddleOCR: {e}")

async def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """Extracts text from image bytes asynchronously."""
    global ocr_engine
    if ocr_engine is None:
        init_ocr()

    try:
        # Convert bytes to numpy array for cv2
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image.")

        # Run OCR in a separate thread to prevent blocking the async event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, ocr_engine.ocr, img, True)
        
        # Parse the result
        extracted_text = []
        if result and len(result) > 0 and result[0] is not None:
            for line in result[0]:
                # line format: [[bbox_points], (text, confidence)]
                extracted_text.append(line[1][0])
                
        return "\n".join(extracted_text)
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        raise e
