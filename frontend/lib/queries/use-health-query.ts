import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api/health";
import { queryKeys } from "@/lib/queries/query-keys";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { HealthResponse } from "@/lib/contracts/health";

export const useHealthQuery = (
  options?: Omit<UseQueryOptions<HealthResponse>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    ...options,
  });
};
