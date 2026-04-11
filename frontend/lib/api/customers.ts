import { httpClient } from "@/lib/api/http-client";
import type { CustomerCreditListResponse, UpdateCreditLedgerRequest, CustomerCreditProfile } from "@/lib/contracts/customers";
import type { Customer } from "@/lib/contracts/sales";

export async function fetchCustomerCreditList(): Promise<CustomerCreditListResponse> {
  const response = await httpClient.get("/api/v1/customers/credit");
  return response.data;
}

export async function fetchCustomerById(customerId: string): Promise<Customer> {
  const response = await httpClient.get(`/api/v1/customers/${customerId}`);
  return response.data;
}

export async function updateCreditLedgerById(
  ledgerId: string,
  payload: UpdateCreditLedgerRequest,
): Promise<CustomerCreditProfile> {
  const response = await httpClient.put(`/api/v1/customers/credit/${ledgerId}`, payload);
  return response.data;
}
