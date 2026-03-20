from pydantic import BaseModel, Field


class InventoryProduct(BaseModel):
    id: str
    name: str
    barcode: str
    stock: int = Field(ge=0)
    price: float = Field(ge=0)
    category: str
    lowStockThreshold: int = Field(ge=1)
    createdAt: str
    updatedAt: str


class InventoryListResponse(BaseModel):
    products: list[InventoryProduct]
    totalCount: int
    categories: list[str]


class AddInventoryProductRequest(BaseModel):
    name: str = Field(min_length=1)
    barcode: str = Field(min_length=1)
    stock: int = Field(ge=0)
    price: float = Field(ge=0)
    category: str = Field(min_length=1)
    lowStockThreshold: int = Field(ge=1)


class UpdateInventoryProductRequest(BaseModel):
    name: str = Field(min_length=1)
    barcode: str = Field(min_length=1)
    stock: int = Field(ge=0)
    price: float = Field(ge=0)
    category: str = Field(min_length=1)
    lowStockThreshold: int = Field(ge=1)


class UpdateInventoryStockRequest(BaseModel):
    stock: int = Field(ge=0)
