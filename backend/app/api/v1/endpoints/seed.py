"""
Seeding endpoints for populating test data.
Provides endpoints to seed, clear, and manage sample data.
"""

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from bson import ObjectId

from app.api.deps import get_mongo_db
from app.services.seed_data import SeedDataGenerator

router = APIRouter(prefix="/seed")


# ─── Schemas ───────────────────────────────────────────────────────────────

class SeedDataRequest(BaseModel):
    """Request to seed data."""
    num_products: int = Field(default=100, ge=0, le=500)
    num_customers: int = Field(default=50, ge=0, le=200)
    num_invoices: int = Field(default=150, ge=0, le=500)


class SeedDataResponse(BaseModel):
    """Response from seeding operation."""
    success: bool
    message: str
    productsCreated: int
    customersCreated: int
    invoicesCreated: int
    totalRecords: int


class ClearDataResponse(BaseModel):
    """Response from clearing operation."""
    success: bool
    message: str
    productsDeleted: int
    customersDeleted: int
    invoicesDeleted: int
    totalRecordsDeleted: int


# ─── Helpers ───────────────────────────────────────────────────────────────

def _get_user_id(request: Request) -> str:
    """Extract user ID from request state."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("", response_model=SeedDataResponse, status_code=status.HTTP_201_CREATED)
async def seed_data(request: Request, payload: SeedDataRequest = SeedDataRequest()):
    """
    Seed database with realistic test data.
    
    Generates:
    - Inventory products
    - Customer records
    - Sales invoices with relationships
    
    Idempotent: Can be called multiple times; duplicates are not created
    but existing count is checked against request.
    """
    user_id = _get_user_id(request)
    database = get_mongo_db()
    
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )

    inventory_col = database["inventory_items"]
    customers_col = database["customers"]
    sales_col = database["sales_invoices"]

    try:
        # Check if user already has seeded data to avoid duplicates
        existing_product_count = await inventory_col.count_documents({"userId": user_id})
        
        # Only seed if user doesn't have significant data yet
        if existing_product_count > 0:
            # User already has data, clear and reseed
            await inventory_col.delete_many({"userId": user_id})
            await customers_col.delete_many({"userId": user_id})
            await sales_col.delete_many({"userId": user_id})

        products_created = 0
        customers_created = 0
        invoices_created = 0

        product_ids: list[str] = []
        customer_ids: list[str] = []

        # Generate and bulk insert products (if requested)
        if payload.num_products > 0:
            products_data = SeedDataGenerator.generate_bulk_products(
                user_id, payload.num_products
            )
            products_result = await inventory_col.insert_many(products_data)
            products_created = len(products_result.inserted_ids)
            product_ids = [str(oid) for oid in products_result.inserted_ids]

        # Generate and bulk insert customers (if requested)
        if payload.num_customers > 0:
            customers_data = SeedDataGenerator.generate_bulk_customers(
                user_id, payload.num_customers
            )
            customers_result = await customers_col.insert_many(customers_data)
            customers_created = len(customers_result.inserted_ids)
            customer_ids = [str(oid) for oid in customers_result.inserted_ids]

        # Generate and bulk insert invoices only when products are available
        if payload.num_invoices > 0 and product_ids:
            invoices_data = SeedDataGenerator.generate_bulk_sales_invoices(
                user_id, product_ids, customer_ids, payload.num_invoices
            )
            invoices_result = await sales_col.insert_many(invoices_data)
            invoices_created = len(invoices_result.inserted_ids)

        total_records = products_created + customers_created + invoices_created

        message = f"Successfully seeded {total_records} records for user"
        if payload.num_invoices > 0 and not product_ids:
            message += ". Skipped invoice generation because no products were seeded"

        return SeedDataResponse(
            success=True,
            message=message,
            productsCreated=products_created,
            customersCreated=customers_created,
            invoicesCreated=invoices_created,
            totalRecords=total_records,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed data: {str(e)}",
        )


@router.delete("", response_model=ClearDataResponse)
async def clear_seeded_data(request: Request):
    """
    Clear all seeded/sample data for a user.
    
    Deletes:
    - All inventory products
    - All customer records
    - All sales invoices
    
    This operation is destructive and cannot be undone for the user session.
    """
    user_id = _get_user_id(request)
    database = get_mongo_db()
    
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )

    try:
        inventory_col = database["inventory_items"]
        customers_col = database["customers"]
        sales_col = database["sales_invoices"]

        # Delete all records for this user
        products_result = await inventory_col.delete_many({"userId": user_id})
        customers_result = await customers_col.delete_many({"userId": user_id})
        sales_result = await sales_col.delete_many({"userId": user_id})

        total_deleted = (
            products_result.deleted_count
            + customers_result.deleted_count
            + sales_result.deleted_count
        )

        return ClearDataResponse(
            success=True,
            message=f"Successfully cleared {total_deleted} records",
            productsDeleted=products_result.deleted_count,
            customersDeleted=customers_result.deleted_count,
            invoicesDeleted=sales_result.deleted_count,
            totalRecordsDeleted=total_deleted,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear data: {str(e)}",
        )


@router.get("/status")
async def get_seed_status(request: Request) -> dict:
    """
    Get current seeding status for the user.
    
    Returns counts of existing records to determine if data exists.
    """
    user_id = _get_user_id(request)
    database = get_mongo_db()
    
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )

    try:
        inventory_col = database["inventory_items"]
        customers_col = database["customers"]
        sales_col = database["sales_invoices"]

        product_count = await inventory_col.count_documents({"userId": user_id})
        customer_count = await customers_col.count_documents({"userId": user_id})
        invoice_count = await sales_col.count_documents({"userId": user_id})

        return {
            "hasData": product_count > 0 or customer_count > 0 or invoice_count > 0,
            "recordCounts": {
                "products": product_count,
                "customers": customer_count,
                "invoices": invoice_count,
            },
            "totalRecords": product_count + customer_count + invoice_count,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get seed status: {str(e)}",
        )
