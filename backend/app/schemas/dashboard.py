from pydantic import BaseModel, Field


class CashVsCredit(BaseModel):
    cash: float = Field(ge=0)
    credit: float = Field(ge=0)


class KPIMetrics(BaseModel):
    todaySales: float = Field(ge=0)
    itemsSold: int = Field(ge=0)
    totalTransactions: int = Field(ge=0)
    cashVsCredit: CashVsCredit
    currency: str | None = "INR"


class LowStockProduct(BaseModel):
    id: str
    name: str
    currentStock: int = Field(ge=0)
    minThreshold: int = Field(ge=1)
    sku: str
    category: str | None = None
    lastRestocked: str | None = None
    createdAt: str
    updatedAt: str


class LowStockResponse(BaseModel):
    products: list[LowStockProduct]
    totalCount: int = Field(ge=0)
    criticalCount: int = Field(ge=0)


class DateRange(BaseModel):
    startDate: str
    endDate: str


class GeneratedReport(BaseModel):
    id: str
    name: str
    type: str  # "sales", "inventory", "customer", "daily_summary"
    generatedAt: str
    dateRange: DateRange
    fileUrl: str | None = None
    fileSize: int | None = None
    status: str  # "completed", "processing", "failed"
    createdAt: str
    updatedAt: str


class DashboardData(BaseModel):
    kpi: KPIMetrics
    lowStock: LowStockResponse
    recentReports: list[GeneratedReport]


class GenerateReportRequest(BaseModel):
    type: str  # "sales", "inventory", "customer", "daily_summary"
    startDate: str  # YYYY-MM-DD format
    endDate: str  # YYYY-MM-DD format
