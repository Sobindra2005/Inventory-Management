from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.inventory import router as inventory_router
from app.api.v1.endpoints.sales import router as sales_router
from app.api.v1.endpoints.customers import router as customers_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(inventory_router, tags=["Inventory"])
api_router.include_router(sales_router, tags=["Sales"])
api_router.include_router(customers_router, tags=["Customers"])
