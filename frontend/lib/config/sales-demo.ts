/**
 * Sales Demo Fallback Toggle Configuration
 * Controls whether to use sample data when API calls fail
 */

export const isSalesDemoFallbackEnabled =
  process.env.NEXT_PUBLIC_SALES_DEMO_FALLBACK !== "false";
