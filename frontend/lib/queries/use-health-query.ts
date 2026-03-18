import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api/health";
import { queryKeys } from "@/lib/queries/query-keys";

export const useHealthQuery = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
  });
};
