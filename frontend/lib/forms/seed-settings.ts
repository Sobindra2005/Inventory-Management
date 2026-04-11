import { z } from "zod";

export const seedSettingsSchema = z.object({
  numProducts: z.coerce.number().int().min(0).max(500),
  numCustomers: z.coerce.number().int().min(0).max(200),
  numInvoices: z.coerce.number().int().min(0).max(500),
}).refine((data) => {
  if (data.numInvoices === 0) {
    return true;
  }

  return data.numProducts > 0;
}, {
  message: "Invoices require at least 1 product.",
  path: ["numProducts"],
});

export type SeedSettingsFormData = z.infer<typeof seedSettingsSchema>;

export const seedSettingsDefaults: SeedSettingsFormData = {
  numProducts: 100,
  numCustomers: 50,
  numInvoices: 150,
};
