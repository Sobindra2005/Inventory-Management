import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Proxy /api to backend so fetch("/api/v1/...") from port 3000 hits the API (avoids "Server action not found")
  async rewrites() {
    const backend = process.env.API_BACKEND_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
