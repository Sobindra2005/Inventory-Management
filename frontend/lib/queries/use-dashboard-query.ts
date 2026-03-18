/**
 * Dashboard TanStack Query hooks
 * Server state management for dashboard data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import type { DashboardData, LowStockResponse, GeneratedReport } from '../contracts/dashboard';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  kpi: () => [...dashboardQueryKeys.all, 'kpi'] as const,
  lowStock: () => [...dashboardQueryKeys.all, 'lowStock'] as const,
  reports: () => [...dashboardQueryKeys.all, 'reports'] as const,
  reportDetail: (id: string) => [...dashboardQueryKeys.reports(), id] as const,
};

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: dashboardQueryKeys.all,
    queryFn: dashboardApi.fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useLowStockProducts = (limit: number = 10) => {
  return useQuery<LowStockResponse>({
    queryKey: dashboardQueryKeys.lowStock(),
    queryFn: () => dashboardApi.fetchLowStockProducts(limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useReports = (limit: number = 10) => {
  return useQuery<GeneratedReport[]>({
    queryKey: dashboardQueryKeys.reports(),
    queryFn: () => dashboardApi.fetchReports(limit),
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
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    },
  });
};

