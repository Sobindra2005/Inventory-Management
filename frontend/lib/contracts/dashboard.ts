/**
 * Dashboard API contracts
 * MongoDB-first typed DTOs for dashboard data
 */

export interface KPIMetrics {
  todaySales: number;
  itemsSold: number;
  totalTransactions: number;
  cashVsCredit: {
    cash: number;
    credit: number;
  };
  currency?: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  sku: string;
  category?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LowStockResponse {
  products: LowStockProduct[];
  totalCount: number;
  criticalCount: number;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'customer' | 'daily_summary';
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  fileUrl?: string;
  fileSize?: number;
  status: 'queued' | 'completed' | 'processing' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  kpi: KPIMetrics;
  lowStock: LowStockResponse;
  recentReports: GeneratedReport[];
}
