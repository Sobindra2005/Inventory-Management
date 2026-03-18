import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCreditList } from "@/lib/api/customers";
import { customersCreditSampleData } from "@/lib/demo/customers-sample-data";
import { isCustomersDemoFallbackEnabled } from "@/lib/config/customers-demo";

function withCustomersFallback<T>(request: () => Promise<T>, fallback: T, source: string): Promise<T> {
  return request().catch((error) => {
    if (isCustomersDemoFallbackEnabled) {
      console.warn(`[Customers] ${source} failed, using demo fallback:`, error.message);
      return fallback;
    }
    throw error;
  });
}

export function useCustomerCreditList() {
  return useQuery({
    queryKey: ["customers", "credit"],
    queryFn: () =>
      withCustomersFallback(
        () => fetchCustomerCreditList(),
        customersCreditSampleData,
        "Customer Credit List"
      ),
    staleTime: 30 * 1000,
  });
}
