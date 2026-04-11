/**
 * Seed API client
 * HTTP functions for data seeding endpoints
 */

import { httpClient } from './http-client';

export interface SeedDataResponse {
  success: boolean;
  message: string;
  productsCreated: number;
  customersCreated: number;
  invoicesCreated: number;
  totalRecords: number;
}

export interface ClearDataResponse {
  success: boolean;
  message: string;
  productsDeleted: number;
  customersDeleted: number;
  invoicesDeleted: number;
  totalRecordsDeleted: number;
}

export interface SeedStatus {
  hasData: boolean;
  recordCounts: {
    products: number;
    customers: number;
    invoices: number;
  };
  totalRecords: number;
}

export const seedApi = {
  /**
   * Seed database with sample data
   */
  seedData: async (options: {
    numProducts?: number;
    numCustomers?: number;
    numInvoices?: number;
  } = {}): Promise<SeedDataResponse> => {
    const response = await httpClient.post<SeedDataResponse>('/api/v1/seed', {
      num_products: options.numProducts ?? 100,
      num_customers: options.numCustomers ?? 50,
      num_invoices: options.numInvoices ?? 150,
    });
    return response.data;
  },

  /**
   * Clear all seeded data
   */
  clearData: async (): Promise<ClearDataResponse> => {
    const response = await httpClient.delete<ClearDataResponse>('/api/v1/seed');
    return response.data;
  },

  /**
   * Get current seed status
   */
  getStatus: async (): Promise<SeedStatus> => {
    const response = await httpClient.get<SeedStatus>('/api/v1/seed/status');
    return response.data;
  },
};
