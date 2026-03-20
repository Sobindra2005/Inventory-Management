from pydantic import BaseModel, Field


class Customer(BaseModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    totalCredit: float = Field(default=0, ge=0)
    dueAmount: float = Field(default=0, ge=0)
    createdAt: str
    updatedAt: str


class CreateCustomerRequest(BaseModel):
    name: str = Field(min_length=1)
    email: str | None = None
    phone: str | None = None


class CustomerListResponse(BaseModel):
    customers: list[Customer]


class CustomerCreditSummary(BaseModel):
    totalCustomers: int = Field(ge=0)
    customersWithDue: int = Field(ge=0)
    totalOutstanding: float = Field(ge=0)
    overdueCustomers: int = Field(ge=0)


class CustomerCreditDetail(BaseModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    totalCreditIssued: float = Field(ge=0)
    outstandingCredit: float = Field(ge=0)
    totalCreditInvoices: int = Field(ge=0)
    lastCreditAt: str | None = None
    lastCreditClearedAt: str | None = None
    creditUntil: str | None = None
    status: str  # "clear", "due", or "overdue"
    createdAt: str
    updatedAt: str


class CustomerCreditListResponse(BaseModel):
    summary: CustomerCreditSummary
    customers: list[CustomerCreditDetail]
