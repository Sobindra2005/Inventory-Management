import { httpClient } from "@/lib/api/http-client";
import type { CustomerCreditListResponse } from "@/lib/contracts/customers";

export async function fetchCustomerCreditList(): Promise<CustomerCreditListResponse> {
  const response = await httpClient.get("/api/v1/customers/credit");
  return response.data;
}
