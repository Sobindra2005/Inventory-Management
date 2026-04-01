from pydantic import BaseModel, Field


class CartItem(BaseModel):
    productId: str
    name: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=1)
    stock: int = Field(ge=0)


class CartItemWithTotal(CartItem):
    itemTotal: float = Field(ge=0)


class PaymentMethod(str):
    """Payment method: cash or credit"""
    pass


class Invoice(BaseModel):
    id: str
    shopName: str
    shopContact: str | None = None
    invoiceId: str
    dateTime: str
    items: list[CartItemWithTotal]
    subtotal: float = Field(ge=0)
    discount: float = Field(ge=0)
    total: float
    paymentMethod: str  # "cash" or "credit"
    customerId: str | None = None
    customerName: str | None = None
    dueAmount: float | None = None
    creditUntil: str | None = None
    itemCount: int = Field(ge=0)


class SalesHistory(BaseModel):
    id: str
    invoiceId: str
    total: float
    paymentMethod: str  # "cash" or "credit"
    timestamp: str
    itemCount: int = Field(ge=0)
    customerName: str | None = None


class CreateSaleRequest(BaseModel):
    items: list[CartItem] = Field(min_items=1)
    discount: float = Field(ge=0)
    paymentMethod: str  # "cash" or "credit"
    customerId: str | None = None
    customerName: str | None = None
    dueAmount: float | None = None
    creditUntil: str | None = None


class SalesHistoryResponse(BaseModel):
    sales: list[SalesHistory]


class CreateSaleResponse(BaseModel):
    invoice: Invoice
    success: bool
