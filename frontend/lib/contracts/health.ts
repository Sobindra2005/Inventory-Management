export type HealthResponse = {
  status: "ok";
  service: "backend";
  mongo: "connected" | "disconnected";
  redis: "connected" | "disconnected";
};
