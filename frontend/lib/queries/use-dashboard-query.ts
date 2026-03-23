/**
 * Dashboard TanStack Query hooks
 * Server state management for dashboard data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import type { DashboardData, LowStockResponse, GeneratedReport } from '../contracts/dashboard';
import { isDashboardDemoFallbackEnabled } from '@/lib/config/dashboard-demo';
import {
  dashboardLowStockSampleData,
  dashboardReportsSampleData,
  dashboardSampleData,
} from '@/lib/demo/dashboard-sample-data';
import { canProceedWithDemoFallback } from '@/lib/demo/fallback-gate';
import { showDemoFallbackNotice } from '@/lib/demo/fallback-notice';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  kpi: () => [...dashboardQueryKeys.all, 'kpi'] as const,
  lowStock: () => [...dashboardQueryKeys.all, 'lowStock'] as const,
  reports: () => [...dashboardQueryKeys.all, 'reports'] as const,
  reportDetail: (id: string) => [...dashboardQueryKeys.reports(), id] as const,
};

const getLowStockSampleForLimit = (limit: number): LowStockResponse => {
  const products = dashboardLowStockSampleData.products.slice(0, limit);
  const criticalCount = products.filter(
    (product) => (product.currentStock / product.minThreshold) * 100 < 25
  ).length;

  return {
    products,
    totalCount: dashboardLowStockSampleData.totalCount,
    criticalCount,
  };
};

const withDashboardFallback = async <T>(
  request: () => Promise<T>,
  fallback: T,
  source: string
): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (!isDashboardDemoFallbackEnabled) {
      throw error;
    }

    const canUseFallback = await canProceedWithDemoFallback();
    if (!canUseFallback) {
      throw error;
    }

    console.warn(
      `[dashboard-demo-fallback] Using sample data for ${source}. Set NEXT_PUBLIC_DASHBOARD_DEMO_FALLBACK=false to disable.`,
      error
    );
    showDemoFallbackNotice(source);
    return fallback;
  }
};

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: dashboardQueryKeys.all,
    queryFn: () =>
      withDashboardFallback(
        dashboardApi.fetchDashboardData,
        dashboardSampleData,
        'dashboard overview'
      ),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useLowStockProducts = (limit: number = 10) => {
  return useQuery<LowStockResponse>({
    queryKey: dashboardQueryKeys.lowStock(),
    queryFn: () =>
      withDashboardFallback(
        () => dashboardApi.fetchLowStockProducts(limit),
        getLowStockSampleForLimit(limit),
        'low stock list'
      ),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useReports = (limit: number = 10) => {
  return useQuery<GeneratedReport[]>({
    queryKey: dashboardQueryKeys.reports(),
    queryFn: () =>
      withDashboardFallback(
        () => dashboardApi.fetchReports(limit),
        dashboardReportsSampleData.slice(0, limit),
        'reports list'
      ),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dashboardApi.generateReport,
    onSuccess: () => {
      // Invalidate reports list to refetch
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.reports() });
    },
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const blob = await dashboardApi.downloadReport(reportId);
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    },
  });
};

