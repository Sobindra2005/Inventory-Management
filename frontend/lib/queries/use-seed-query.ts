/**
 * React Query hooks for seed operations
 * Provides useQuery and useMutation hooks for data seeding
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seedApi, type SeedDataResponse, type ClearDataResponse, type SeedStatus } from '@/lib/api/seed';

export const SEED_QUERY_KEYS = {
  all: ['seed'] as const,
  status: () => [...SEED_QUERY_KEYS.all, 'status'] as const,
};

/**
 * Get current seed status for the user
 */
export function useSeedStatus() {
  return useQuery({
    queryKey: SEED_QUERY_KEYS.status(),
    queryFn: async () => {
      try {
        return await seedApi.getStatus();
      } catch (error) {
        // If endpoint doesn't exist yet, assume no data
        return {
          hasData: false,
          recordCounts: { products: 0, customers: 0, invoices: 0 },
          totalRecords: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Seed database with sample data
 */
export function useSeedData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: {
      numProducts?: number;
      numCustomers?: number;
      numInvoices?: number;
    } = {}) => {
      return await seedApi.seedData(options);
    },
    onSuccess: async (data: SeedDataResponse) => {
      // Invalidate all dashboard queries
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: SEED_QUERY_KEYS.status() });
      return data;
    },
  });
}

/**
 * Clear all seeded data
 */
export function useClearData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await seedApi.clearData();
    },
    onSuccess: async (data: ClearDataResponse) => {
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: SEED_QUERY_KEYS.status() });
      return data;
    },
  });
}
