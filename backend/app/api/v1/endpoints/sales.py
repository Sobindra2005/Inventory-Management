from datetime import datetime, timezone
import uuid

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.deps import get_mongo_db
from app.core.config import settings
from app.schemas.sales import (
    CartItemWithTotal,
    CreateSaleRequest,
    CreateSaleResponse,
    Invoice,
    SalesHistory,
    SalesHistoryResponse,
)

router = APIRouter(prefix="/sales")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso_utc(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


def _generate_invoice_id() -> str:
    """Generate invoice ID: INV-YYYYMMDD-XXXXX"""
    now = _utc_now()
    date_part = now.strftime("%Y%m%d")
    unique_part = str(uuid.uuid4()).replace("-", "")[:5].upper()
    return f"INV-{date_part}-{unique_part}"


def _to_sales_history(document: dict) -> SalesHistory:
    return SalesHistory(
        id=str(document["_id"]),
        invoiceId=document["invoiceId"],
        total=document["total"],
        paymentMethod=document["paymentMethod"],
        timestamp=_to_iso_utc(document["dateTime"]),
        itemCount=document["itemCount"],
        customerName=document.get("customerName"),
    )


def _to_invoice(document: dict) -> Invoice:
    items = [
        CartItemWithTotal(
            productId=item["productId"],
            name=item["name"],
            price=item["price"],
            quantity=item["quantity"],
            stock=item["stock"],
            itemTotal=item["itemTotal"],
        )
        for item in document.get("items", [])
    ]
    return Invoice(
        id=str(document["_id"]),
        shopName=document.get("shopName", "POS Store"),
        shopContact=document.get("shopContact"),
        invoiceId=document["invoiceId"],
        dateTime=_to_iso_utc(document["dateTime"]),
        items=items,
        subtotal=document["subtotal"],
        discount=document["discount"],
        total=document["total"],
        paymentMethod=document["paymentMethod"],
        customerId=document.get("customerId"),
        customerName=document.get("customerName"),
        dueAmount=document.get("dueAmount"),
        itemCount=document["itemCount"],
    )


@router.post("", response_model=CreateSaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(request: Request, payload: CreateSaleRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    inventory_col = database["inventory_items"]
    sales_col = database["sales_invoices"]
    credit_ledger_col = database["credit_ledger"]

    # Validate and deduct stock for all items
    items_with_totals = []
    for item in payload.items:
        product = await inventory_col.find_one(
            {"_id": ObjectId(item.productId), "userId": user_id}
        )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.productId} not found",
            )
        if product["stock"] < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient stock for {product['name']}",
            )

        item_total = item.price * item.quantity
        items_with_totals.append(
            {
                "productId": item.productId,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "stock": product["stock"],
                "itemTotal": item_total,
            }
        )

        # Deduct stock
        await inventory_col.update_one(
            {"_id": ObjectId(item.productId), "userId": user_id},
            {
                "$inc": {"stock": -item.quantity},
                "$set": {"updatedAt": _utc_now()},
            },
        )

    # Calculate totals
    subtotal = sum(item["itemTotal"] for item in items_with_totals)
    total = subtotal - payload.discount

    # Create invoice
    now = _utc_now()
    invoice_id = _generate_invoice_id()
    invoice_doc = {
        "userId": user_id,
        "invoiceId": invoice_id,
        "shopName": "POS Store",
        "shopContact": None,
        "dateTime": now,
        "items": items_with_totals,
        "subtotal": subtotal,
        "discount": payload.discount,
        "total": total,
        "paymentMethod": payload.paymentMethod,
        "customerId": payload.customerId,
        "customerName": payload.customerName,
        "dueAmount": payload.dueAmount if payload.paymentMethod == "credit" else None,
        "itemCount": len(items_with_totals),
        "createdAt": now,
        "updatedAt": now,
    }

    result = await sales_col.insert_one(invoice_doc)

    # Create/update credit ledger if payment is credit
    if payload.paymentMethod == "credit" and payload.customerId:
        credit_doc = await credit_ledger_col.find_one(
            {"userId": user_id, "customerId": payload.customerId}
        )
        if credit_doc:
            # Update existing credit ledger
            await credit_ledger_col.update_one(
                {"_id": credit_doc["_id"]},
                {
                    "$inc": {
                        "totalCreditIssued": total,
                        "outstandingCredit": total,
                        "totalCreditInvoices": 1,
                    },
                    "$set": {
                        "lastCreditAt": now,
                        "updatedAt": now,
                    },
                },
            )
        else:
            # Create new credit ledger
            await credit_ledger_col.insert_one(
                {
                    "userId": user_id,
                    "customerId": payload.customerId,
                    "customerName": payload.customerName,
                    "totalCreditIssued": total,
                    "outstandingCredit": total,
                    "totalCreditInvoices": 1,
                    "lastCreditAt": now,
                    "lastCreditClearedAt": None,
                    "creditUntil": None,
                    "status": "due",
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

    # Return created invoice
    created = await sales_col.find_one({"_id": result.inserted_id, "userId": user_id})
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create invoice")

    return CreateSaleResponse(invoice=_to_invoice(created), success=True)


@router.get("/history", response_model=SalesHistoryResponse)
async def get_sales_history(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    sales_col = database["sales_invoices"]

    documents = await sales_col.find({"userId": user_id}).sort("dateTime", -1).to_list(length=None)
    sales = [_to_sales_history(doc) for doc in documents]

    return SalesHistoryResponse(sales=sales)


@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    sales_col = database["sales_invoices"]

    try:
        object_id = ObjectId(invoice_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    document = await sales_col.find_one({"_id": object_id, "userId": user_id})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    return _to_invoice(document)
