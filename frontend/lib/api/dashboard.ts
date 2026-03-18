/**
 * Dashboard API client
 * HTTP functions for dashboard endpoints
 */

import { httpClient } from './http-client';
import type { DashboardData, LowStockResponse, GeneratedReport } from '../contracts/dashboard';

export const dashboardApi = {
  /**
   * Get KPI metrics and dashboard overview data
   */
  fetchDashboardData: async (): Promise<DashboardData> => {
    const response = await httpClient.get<DashboardData>('/api/v1/dashboard');
    return response.data;
  },

  /**
   * Get low stock products
   */
  fetchLowStockProducts: async (limit: number = 10): Promise<LowStockResponse> => {
    const response = await httpClient.get<LowStockResponse>('/api/v1/dashboard/low-stock', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Generate a new report
   */
  generateReport: async (params: {
    type: 'sales' | 'inventory' | 'customer' | 'daily_summary';
    startDate: string;
    endDate: string;
  }): Promise<GeneratedReport> => {
    const response = await httpClient.post<GeneratedReport>('/api/v1/dashboard/reports/generate', params);
    return response.data;
  },

  /**
   * Get list of generated reports
   */
  fetchReports: async (limit: number = 10): Promise<GeneratedReport[]> => {
    const response = await httpClient.get<GeneratedReport[]>('/api/v1/dashboard/reports', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Download report file
   */
  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await httpClient.get(`/api/v1/dashboard/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
