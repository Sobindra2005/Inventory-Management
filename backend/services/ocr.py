# Disable Paddle OneDNN and new executor to avoid "ConvertPirAttribute2RuntimeAttribute not support"
# (error in new_executor/instruction/onednn/onednn_instruction.cc)
import os
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_use_new_executor"] = "0"

import paddle
# Only FLAGS_use_mkldnn can be set via set_flags; FLAGS_use_new_executor is env-only
paddle.set_flags({"FLAGS_use_mkldnn": False})

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
        # enable_mkldnn=False required: PaddleX ignores FLAGS_use_mkldnn and uses run_mode="mkldnn" by default,
        # which hits PaddlePaddle 3.3+ bug (ConvertPirAttribute2RuntimeAttribute not support)
        ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
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
        # PaddleOCR 3.x: use predict() for correct result shape; .ocr() is deprecated and returns wrong structure (char-level noise)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, ocr_engine.predict, img)

        # Parse: result is list of OCRResult (one per page), each has rec_texts = list of line strings
        extracted_text = []
        if result:
            for page in result:
                rec_texts = page.get("rec_texts") if hasattr(page, "get") else getattr(page, "rec_texts", [])
                if rec_texts:
                    extracted_text.extend(rec_texts if isinstance(rec_texts, list) else [])

        return "\n".join(extracted_text)
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        raise e
