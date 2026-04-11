from typing import Literal

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


class UpdateCustomerRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    email: str | None = None
    phone: str | None = None


class UpdateCreditLedgerRequest(BaseModel):
    status: Literal["clear", "due", "overdue"] | None = None
    outstandingCredit: float | None = Field(default=None, ge=0)
    totalCreditIssued: float | None = Field(default=None, ge=0)
    totalCreditInvoices: int | None = Field(default=None, ge=0)
    creditUntil: str | None = None
    lastCreditAt: str | None = None
    lastCreditClearedAt: str | None = None


class CustomerListResponse(BaseModel):
    customers: list[Customer]


class CustomerCreditSummary(BaseModel):
    totalCustomers: int = Field(ge=0)
    customersWithDue: int = Field(ge=0)
    totalOutstanding: float = Field(ge=0)
    overdueCustomers: int = Field(ge=0)


class CustomerCreditDetail(BaseModel):
    id: str
    customerId: str | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    totalCreditIssued: float = Field(ge=0)
    outstandingCredit: float = Field(ge=0)
    totalCreditInvoices: int = Field(ge=0)
    lastCreditAt: str | None = None
    lastCreditClearedAt: str | None = None
    creditUntil: str | None = None
    status: Literal["clear", "due", "overdue"]
    createdAt: str
    updatedAt: str


class CustomerCreditListResponse(BaseModel):
    summary: CustomerCreditSummary
    customers: list[CustomerCreditDetail]
