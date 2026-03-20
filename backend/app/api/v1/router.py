from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.inventory import router as inventory_router
from app.api.v1.endpoints.sales import router as sales_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.realtime import router as realtime_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(inventory_router, tags=["Inventory"])
api_router.include_router(sales_router, tags=["Sales"])
api_router.include_router(customers_router, tags=["Customers"])
api_router.include_router(dashboard_router, tags=["Dashboard"])
api_router.include_router(notifications_router, tags=["Notifications"])
api_router.include_router(realtime_router, tags=["Realtime"])
