from datetime import datetime, timezone, timedelta
import uuid

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.deps import get_mongo_db
from app.schemas.dashboard import (
    CashVsCredit,
    DashboardData,
    DateRange,
    GenerateReportRequest,
    GeneratedReport,
    KPIMetrics,
    LowStockProduct,
    LowStockResponse,
)

router = APIRouter(prefix="/dashboard")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso_utc(value: datetime) -> str:
    if value is None:
        return None
    return value.isoformat().replace("+00:00", "Z")


def _to_iso_date(value: datetime) -> str:
    return value.strftime("%Y-%m-%d")


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


def _to_low_stock_product(document: dict) -> LowStockProduct:
    return LowStockProduct(
        id=str(document["_id"]),
        name=document["name"],
        currentStock=document["stock"],
        minThreshold=document["lowStockThreshold"],
        sku=document["barcode"],
        category=document.get("category"),
        lastRestocked=_to_iso_utc(document.get("updatedAt")),
        createdAt=_to_iso_utc(document["createdAt"]),
        updatedAt=_to_iso_utc(document["updatedAt"]),
    )


def _to_generated_report(document: dict) -> GeneratedReport:
    return GeneratedReport(
        id=str(document["_id"]),
        name=document["name"],
        type=document["type"],
        generatedAt=_to_iso_utc(document["generatedAt"]),
        dateRange=DateRange(
            startDate=document["dateRange"]["startDate"],
            endDate=document["dateRange"]["endDate"],
        ),
        fileUrl=document.get("fileUrl"),
        fileSize=document.get("fileSize"),
        status=document.get("status", "completed"),
        createdAt=_to_iso_utc(document["createdAt"]),
        updatedAt=_to_iso_utc(document["updatedAt"]),
    )


@router.get("", response_model=DashboardData)
async def get_dashboard(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    sales_col = database["sales_invoices"]
    inventory_col = database["inventory_items"]
    reports_col = database["reports"]

    # Calculate KPIs
    today_start = _utc_now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_sales_docs = await sales_col.find(
        {"userId": user_id, "dateTime": {"$gte": today_start, "$lt": today_end}}
    ).to_list(length=None)

    total_items_sold = 0
    cash_total = 0.0
    credit_total = 0.0

    for doc in today_sales_docs:
        total_items_sold += doc.get("itemCount", 0)
        if doc.get("paymentMethod") == "cash":
            cash_total += doc.get("total", 0)
        else:
            credit_total += doc.get("total", 0)

    kpi = KPIMetrics(
        todaySales=round(cash_total + credit_total, 2),
        itemsSold=total_items_sold,
        totalTransactions=len(today_sales_docs),
        cashVsCredit=CashVsCredit(cash=round(cash_total, 2), credit=round(credit_total, 2)),
        currency="INR",
    )

    # Get low stock products
    low_stock_docs = await inventory_col.find(
        {"userId": user_id, "$expr": {"$lte": ["$stock", "$lowStockThreshold"]}}
    ).sort("stock", 1).to_list(length=None)

    low_stock_products = [_to_low_stock_product(doc) for doc in low_stock_docs]
    critical_count = sum(1 for doc in low_stock_docs if doc["stock"] == 0)

    low_stock = LowStockResponse(
        products=low_stock_products,
        totalCount=len(low_stock_products),
        criticalCount=critical_count,
    )

    # Get recent reports
    recent_reports_docs = await reports_col.find({"userId": user_id}).sort("generatedAt", -1).limit(5).to_list(length=None)
    recent_reports = [_to_generated_report(doc) for doc in recent_reports_docs]

    return DashboardData(kpi=kpi, lowStock=low_stock, recentReports=recent_reports)


@router.get("/low-stock", response_model=LowStockResponse)
async def get_low_stock_products(request: Request, limit: int = 10):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    inventory_col = database["inventory_items"]

    documents = await inventory_col.find(
        {"userId": user_id, "$expr": {"$lte": ["$stock", "$lowStockThreshold"]}}
    ).sort("stock", 1).limit(limit).to_list(length=None)

    products = [_to_low_stock_product(doc) for doc in documents]
    total_count = await inventory_col.count_documents(
        {"userId": user_id, "$expr": {"$lte": ["$stock", "$lowStockThreshold"]}}
    )
    critical_count = sum(1 for doc in documents if doc["stock"] == 0)

    return LowStockResponse(products=products, totalCount=total_count, criticalCount=critical_count)


@router.post("/reports/generate", response_model=GeneratedReport, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(request: Request, payload: GenerateReportRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    reports_col = database["reports"]

    now = _utc_now()
    report_doc = {
        "userId": user_id,
        "name": f"{payload.type.title()} Report - {now.strftime('%d %b')}",
        "type": payload.type,
        "generatedAt": now,
        "dateRange": {
            "startDate": payload.startDate,
            "endDate": payload.endDate,
        },
        "fileUrl": None,
        "fileSize": None,
        "status": "processing",
        "createdAt": now,
        "updatedAt": now,
    }

    result = await reports_col.insert_one(report_doc)
    created = await reports_col.find_one({"_id": result.inserted_id, "userId": user_id})

    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create report")

    return _to_generated_report(created)


@router.get("/reports", response_model=list[GeneratedReport])
async def get_reports(request: Request, limit: int = 10):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    reports_col = database["reports"]

    documents = await reports_col.find({"userId": user_id}).sort("generatedAt", -1).limit(limit).to_list(length=None)
    reports = [_to_generated_report(doc) for doc in documents]

    return reports


@router.get("/reports/{report_id}/download")
async def download_report(report_id: str, request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    reports_col = database["reports"]

    try:
        object_id = ObjectId(report_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    document = await reports_col.find_one({"_id": object_id, "userId": user_id})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if document.get("status") != "completed" or not document.get("fileUrl"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report is not ready for download",
        )

    # Note: In production, this would stream the actual file from storage (e.g., Cloudinary, S3)
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Report download not yet implemented",
    )
