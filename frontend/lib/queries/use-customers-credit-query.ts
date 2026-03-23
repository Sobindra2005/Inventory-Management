import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCreditList } from "@/lib/api/customers";
import { customersCreditSampleData } from "@/lib/demo/customers-sample-data";
import { isCustomersDemoFallbackEnabled } from "@/lib/config/customers-demo";
import { canProceedWithDemoFallback } from "@/lib/demo/fallback-gate";
// import { showDemoFallbackNotice } from "@/lib/demo/fallback-notice";

async function withCustomersFallback<T>(request: () => Promise<T>, fallback: T, source: string): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!isCustomersDemoFallbackEnabled) {
      throw error;
    }

    const canUseFallback = await canProceedWithDemoFallback();
    if (canUseFallback) {
      console.warn(`[Customers] ${source} failed, using demo fallback:`, error);
      // showDemoFallbackNotice(source);
      return fallback;
    }

    throw error;
  }
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
