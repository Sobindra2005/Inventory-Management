from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.deps import get_mongo_db
from app.schemas.customers import (
    CreateCustomerRequest,
    Customer,
    CustomerCreditDetail,
    CustomerCreditListResponse,
    CustomerCreditSummary,
    CustomerListResponse,
    UpdateCreditLedgerRequest,
    UpdateCustomerRequest,
)

router = APIRouter(prefix="/customers")
VALID_CREDIT_STATUSES = {"clear", "due", "overdue"}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso_utc(value: datetime) -> str:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return value.isoformat().replace("+00:00", "Z")


def _normalize_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            return None
    return None


def _resolve_credit_status(outstanding_credit: float, credit_until: datetime | None) -> str:
    if outstanding_credit <= 0:
        return "clear"

    if credit_until and credit_until < _utc_now():
        return "overdue"

    return "due"


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


def _to_customer(document: dict) -> Customer:
    return Customer(
        id=str(document["_id"]),
        name=document["name"],
        email=document.get("email"),
        phone=document.get("phone"),
        totalCredit=document.get("totalCredit", 0),
        dueAmount=document.get("dueAmount", 0),
        createdAt=_to_iso_utc(document["createdAt"]),
        updatedAt=_to_iso_utc(document["updatedAt"]),
    )


def _to_customer_credit_detail(document: dict) -> CustomerCreditDetail:
    outstanding_credit = document.get("outstandingCredit", 0)
    credit_until = _normalize_datetime(document.get("creditUntil"))
    computed_status = _resolve_credit_status(outstanding_credit, credit_until)
    manual_status = document.get("manualStatus") or document.get("status")
    resolved_status = manual_status if manual_status in VALID_CREDIT_STATUSES else computed_status

    return CustomerCreditDetail(
        id=str(document["_id"]),
        customerId=document.get("customerId"),
        name=document.get("customerName") or "Unknown Customer",
        email=document.get("email"),
        phone=document.get("phone"),
        totalCreditIssued=document.get("totalCreditIssued", 0),
        outstandingCredit=outstanding_credit,
        totalCreditInvoices=document.get("totalCreditInvoices", 0),
        lastCreditAt=_to_iso_utc(document.get("lastCreditAt")),
        lastCreditClearedAt=_to_iso_utc(document.get("lastCreditClearedAt")),
        creditUntil=_to_iso_utc(credit_until),
        status=resolved_status,
        createdAt=_to_iso_utc(document["createdAt"]),
        updatedAt=_to_iso_utc(document["updatedAt"]),
    )


@router.post("", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def create_customer(request: Request, payload: CreateCustomerRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    customers_col = database["customers"]

    now = _utc_now()
    document = {
        "userId": user_id,
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "totalCredit": 0,
        "dueAmount": 0,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await customers_col.insert_one(document)
    created = await customers_col.find_one({"_id": result.inserted_id, "userId": user_id})

    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create customer")

    return _to_customer(created)


@router.get("", response_model=CustomerListResponse)
async def list_customers(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    customers_col = database["customers"]

    documents = await customers_col.find({"userId": user_id}).sort("updatedAt", -1).to_list(length=None)
    customers = [_to_customer(doc) for doc in documents]

    return CustomerListResponse(customers=customers)


@router.get("/credit", response_model=CustomerCreditListResponse)
async def get_customer_credit(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    credit_ledger_col = database["credit_ledger"]

    documents = await credit_ledger_col.find({"userId": user_id}).sort("updatedAt", -1).to_list(length=None)
    customers = [_to_customer_credit_detail(doc) for doc in documents]

    # Compute summary
    total_customers = len(documents)
    customers_with_due = sum(1 for doc in documents if doc.get("outstandingCredit", 0) > 0)
    total_outstanding = sum(doc.get("outstandingCredit", 0) for doc in documents)
    overdue_customers = sum(1 for customer in customers if customer.status == "overdue")

    summary = CustomerCreditSummary(
        totalCustomers=total_customers,
        customersWithDue=customers_with_due,
        totalOutstanding=total_outstanding,
        overdueCustomers=overdue_customers,
    )

    return CustomerCreditListResponse(summary=summary, customers=customers)


@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    customers_col = database["customers"]

    try:
        object_id = ObjectId(customer_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    document = await customers_col.find_one({"_id": object_id, "userId": user_id})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    return _to_customer(document)


@router.put("/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, request: Request, payload: UpdateCustomerRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    customers_col = database["customers"]
    sales_col = database["sales_invoices"]

    try:
        object_id = ObjectId(customer_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    existing = await customers_col.find_one({"_id": object_id, "userId": user_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    update_fields = payload.model_dump(exclude_unset=True)
    if not update_fields:
        return _to_customer(existing)

    now = _utc_now()

    if update_fields:
        update_fields["updatedAt"] = now

        await customers_col.update_one(
            {"_id": object_id, "userId": user_id},
            {"$set": update_fields},
        )

    # Keep denormalized customer name in ledgers and invoices aligned.
    if "name" in update_fields:
        await credit_ledger_col.update_many(
            {"userId": user_id, "customerId": customer_id},
            {"$set": {"customerName": update_fields["name"], "updatedAt": now}},
        )
        await sales_col.update_many(
            {"userId": user_id, "customerId": customer_id},
            {"$set": {"customerName": update_fields["name"], "updatedAt": now}},
        )

    updated = await customers_col.find_one({"_id": object_id, "userId": user_id})
    if updated is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update customer")

    return _to_customer(updated)


@router.put("/credit/{ledger_id}", response_model=CustomerCreditDetail)
async def update_credit_ledger(ledger_id: str, request: Request, payload: UpdateCreditLedgerRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    credit_ledger_col = database["credit_ledger"]

    try:
        ledger_object_id = ObjectId(ledger_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit ledger record not found")

    existing = await credit_ledger_col.find_one({"_id": ledger_object_id, "userId": user_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit ledger record not found")

    payload_data = payload.model_dump(exclude_unset=True)
    if not payload_data:
        return _to_customer_credit_detail(existing)

    update_fields = {}

    for numeric_field in ("outstandingCredit", "totalCreditIssued", "totalCreditInvoices"):
        if numeric_field in payload_data:
            update_fields[numeric_field] = payload_data[numeric_field]

    if "status" in payload_data:
        update_fields["status"] = payload_data["status"]
        update_fields["manualStatus"] = payload_data["status"]

    for date_field in ("creditUntil", "lastCreditAt", "lastCreditClearedAt"):
        if date_field not in payload_data:
            continue

        raw_value = payload_data[date_field]
        if raw_value in (None, ""):
            update_fields[date_field] = None
            continue

        parsed_value = _normalize_datetime(raw_value)
        if parsed_value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid {date_field} format",
            )
        update_fields[date_field] = parsed_value

    if not update_fields:
        return _to_customer_credit_detail(existing)

    update_fields["updatedAt"] = _utc_now()

    await credit_ledger_col.update_one(
        {"_id": ledger_object_id, "userId": user_id},
        {"$set": update_fields},
    )

    updated = await credit_ledger_col.find_one({"_id": ledger_object_id, "userId": user_id})
    if updated is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update credit ledger")

    return _to_customer_credit_detail(updated)
