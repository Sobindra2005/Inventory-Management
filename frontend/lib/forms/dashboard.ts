/**
 * Dashboard form schemas
 * Zod schemas for form validation
 */

import { z } from "zod";

export const generateReportSchema = z.object({
  type: z.enum(["sales", "inventory", "customer", "daily_summary"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

export type GenerateReportFormData = z.infer<typeof generateReportSchema>;

export const generateReportDefaults: GenerateReportFormData = {
  type: "daily_summary",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
};
