import { httpClient } from "@/lib/api/http-client";
import type { HealthResponse } from "@/lib/contracts/health";

export const getHealth = async () => {
  const response = await httpClient.get<HealthResponse>("/api/v1/health");
  return response.data;
};
