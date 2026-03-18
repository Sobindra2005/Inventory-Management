const dashboardDemoFallbackEnv = process.env.NEXT_PUBLIC_DASHBOARD_DEMO_FALLBACK;

export const isDashboardDemoFallbackEnabled =
  dashboardDemoFallbackEnv === undefined
    ? true
    : dashboardDemoFallbackEnv.toLowerCase() === "true";
