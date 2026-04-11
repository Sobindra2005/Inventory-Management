/**
 * Sales API Client
 * HTTP functions for sales transactions, invoices, and sales history
 */

import { httpClient } from "@/lib/api/http-client";
import type {
  CreateSaleRequest,
  CreateSaleResponse,
  SalesHistoryResponse,
  CreateCustomerRequest,
  Invoice,
  Customer,
} from "@/lib/contracts/sales";

/**
 * Fetch sales history
 */
export async function fetchSalesHistory(): Promise<SalesHistoryResponse> {
  const response = await httpClient.get("/api/v1/sales/history");
  return response.data;
}

/**
 * Create a new sale/invoice
 */
export async function createSale(payload: CreateSaleRequest): Promise<CreateSaleResponse> {
  const response = await httpClient.post("/api/v1/sales", payload);
  return response.data;
}

/**
 * Fetch a specific invoice by ID
 */
export async function fetchInvoice(invoiceId: string): Promise<Invoice> {
  const response = await httpClient.get(`/api/v1/sales/invoices/${invoiceId}`);
  return response.data;
}

/**
 * Create a new customer
 */
export async function createCustomer(payload: CreateCustomerRequest): Promise<Customer> {
  const response = await httpClient.post("/api/v1/customers", payload);
  return response.data;
}

/**
 * Fetch all customers
 */
export async function fetchCustomers(): Promise<{ customers: Customer[] }> {
  const response = await httpClient.get("/api/v1/customers");
  return response.data;
}

/**
 * Fetch a specific customer by ID
 */
export async function fetchCustomer(customerId: string): Promise<Customer> {
  const response = await httpClient.get(`/api/v1/customers/${customerId}`);
  return response.data;
}
