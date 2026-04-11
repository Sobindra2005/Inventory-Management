/**
 * Sales React Query Hooks
 * TanStack Query hooks for sales operations with fallback support
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSalesHistory,
  createSale,
  fetchInvoice,
  createCustomer,
  fetchCustomers,
  fetchCustomer,
} from "@/lib/api/sales";
import { salesHistorySampleData, invoiceSampleData } from "@/lib/demo/sales-sample-data";
import { isSalesDemoFallbackEnabled } from "@/lib/config/sales-demo";
import type { CreateSaleRequest, SalesHistoryResponse, Customer } from "@/lib/contracts/sales";
import { canProceedWithDemoFallback } from "@/lib/demo/fallback-gate";
import { showDemoFallbackNotice } from "@/lib/demo/fallback-notice";

/**
 * Generic fallback wrapper for sales queries
 */
async function withSalesFallback<T>(request: () => Promise<T>, fallback: T, key: string): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!isSalesDemoFallbackEnabled) {
      throw error;
    }

    const canUseFallback = await canProceedWithDemoFallback();
    if (canUseFallback) {
      console.warn(`[Sales] ${key} failed, using demo fallback:`, error);
      showDemoFallbackNotice(key);
      return fallback;
    }

    throw error;
  }
}

/**
 * Fetch sales history with fallback
 */
export function useSalesHistory() {
  return useQuery({
    queryKey: ["salesHistory"],
    queryFn: async () => {
      return withSalesFallback(
        () => fetchSalesHistory(),
        { sales: salesHistorySampleData },
        "Sales History"
      );
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create a new sale/invoice with fallback
 */
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSaleRequest) => {
      return withSalesFallback(
        () => createSale(payload),
        { invoice: invoiceSampleData, success: true },
        "Create Sale"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesHistory"] });
    },
  });
}

/**
 * Fetch a specific invoice with fallback
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => fetchInvoice(invoiceId),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!invoiceId,
  });
}

/**
 * Create a new customer with fallback
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; email?: string; phone?: string }) => {
      return withSalesFallback(
        () => createCustomer(payload),
        {
          id: `cust-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          totalCredit: 0,
          dueAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer,
        "Create Customer"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/**
 * Fetch all customers with fallback
 */
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      return withSalesFallback(
        () => fetchCustomers(),
        {
          customers: [
            {
              id: "cust-1",
              name: "Jane Doe",
              email: "jane@example.com",
              phone: "+1-555-0101",
              totalCredit: 2500.00,
              dueAmount: 531.50,
              createdAt: "2026-01-01T00:00:00Z",
              updatedAt: "2026-03-18T00:00:00Z",
            },
            {
              id: "cust-2",
              name: "Bob Johnson",
              email: "bob@example.com",
              phone: "+1-555-0102",
              totalCredit: 1500.00,
              dueAmount: 0,
              createdAt: "2026-01-05T00:00:00Z",
              updatedAt: "2026-03-15T00:00:00Z",
            },
            {
              id: "cust-3",
              name: "John Smith",
              email: "john@example.com",
              phone: "+1-555-0103",
              totalCredit: 800.00,
              dueAmount: 580.00,
              createdAt: "2026-02-10T00:00:00Z",
              updatedAt: "2026-03-18T00:00:00Z",
            },
          ],
        },
        "Customers"
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a specific customer with fallback
 */
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      return withSalesFallback(
        () => fetchCustomer(customerId),
        {
          id: customerId,
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+1-555-0101",
          totalCredit: 2500.00,
          dueAmount: 531.50,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-03-18T00:00:00Z",
        } as Customer,
        `Customer ${customerId}`
      );
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!customerId,
  });
}
