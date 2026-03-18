/**
 * Sales Forms Schemas
 * Zod validation schemas for sales-related forms
 */

import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

export const createCustomerDefaults: CreateCustomerFormData = {
  name: "",
  email: "",
  phone: "",
};

export const discountSchema = z.object({
  amount: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100000, "Discount is too high"),
});

export type DiscountFormData = z.infer<typeof discountSchema>;
