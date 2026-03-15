from pydantic import BaseModel
from typing import Optional

class BillResponse(BaseModel):
    id: str | None = None
    filename: str
    cloudinary_url: str
    extracted_text: str
    status: str

    class Config:
        from_attributes = True
