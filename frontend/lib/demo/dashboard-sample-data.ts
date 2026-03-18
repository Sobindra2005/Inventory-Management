import type {
  DashboardData,
  GeneratedReport,
  LowStockResponse,
} from "@/lib/contracts/dashboard";

const now = "2026-03-18T10:30:00.000Z";

export const dashboardReportsSampleData: GeneratedReport[] = [
  {
    id: "demo-report-1",
    name: "Daily Summary - Mar 18, 2026",
    type: "daily_summary",
    generatedAt: "2026-03-18T09:05:00.000Z",
    dateRange: {
      startDate: "2026-03-17",
      endDate: "2026-03-18",
    },
    fileUrl: "/demo/reports/daily-summary-mar-18-2026.pdf",
    fileSize: 262144,
    status: "completed",
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-03-18T09:05:00.000Z",
  },
  {
    id: "demo-report-2",
    name: "Sales Report - Week 11",
    type: "sales",
    generatedAt: "2026-03-17T14:30:00.000Z",
    dateRange: {
      startDate: "2026-03-10",
      endDate: "2026-03-17",
    },
    fileUrl: "/demo/reports/sales-week-11-2026.pdf",
    fileSize: 524288,
    status: "completed",
    createdAt: "2026-03-17T14:25:00.000Z",
    updatedAt: "2026-03-17T14:30:00.000Z",
  },
  {
    id: "demo-report-3",
    name: "Inventory Health - Mid March",
    type: "inventory",
    generatedAt: "2026-03-17T08:40:00.000Z",
    dateRange: {
      startDate: "2026-03-01",
      endDate: "2026-03-17",
    },
    status: "processing",
    createdAt: "2026-03-17T08:40:00.000Z",
    updatedAt: "2026-03-17T08:40:00.000Z",
  },
];

export const dashboardLowStockSampleData: LowStockResponse = {
  products: [
    {
      id: "demo-product-1",
      name: "Wireless Barcode Scanner",
      currentStock: 4,
      minThreshold: 20,
      sku: "WBS-1001",
      category: "Hardware",
      lastRestocked: "2026-03-10T00:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "demo-product-2",
      name: "Thermal Receipt Paper (80mm)",
      currentStock: 12,
      minThreshold: 50,
      sku: "TRP-2080",
      category: "Consumables",
      lastRestocked: "2026-03-12T00:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "demo-product-3",
      name: "Label Rolls - Premium",
      currentStock: 8,
      minThreshold: 30,
      sku: "LBL-PRM-30",
      category: "Consumables",
      lastRestocked: "2026-03-11T00:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "demo-product-4",
      name: "POS Drawer Lock",
      currentStock: 2,
      minThreshold: 10,
      sku: "POS-DL-02",
      category: "Hardware",
      lastRestocked: "2026-03-09T00:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
  ],
  totalCount: 4,
  criticalCount: 2,
};

export const dashboardSampleData: DashboardData = {
  kpi: {
    todaySales: 18450,
    itemsSold: 128,
    totalTransactions: 63,
    cashVsCredit: {
      cash: 39,
      credit: 61,
    },
    currency: "USD",
  },
  lowStock: dashboardLowStockSampleData,
  recentReports: dashboardReportsSampleData,
};
