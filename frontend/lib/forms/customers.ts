import { z } from "zod";
import type { CreditStatus } from "@/lib/contracts/customers";

export const updateCreditLedgerSchema = z.object({
  status: z.enum(["clear", "due", "overdue"]),
  outstandingCredit: z.number().min(0, "Outstanding credit cannot be negative"),
  totalCreditIssued: z.number().min(0, "Total credit cannot be negative"),
  totalCreditInvoices: z.number().int().min(0, "Credit invoices cannot be negative"),
  creditUntil: z.string().optional().or(z.literal("")),
  lastCreditAt: z.string().optional().or(z.literal("")),
  lastCreditClearedAt: z.string().optional().or(z.literal("")),
});

export type UpdateCreditLedgerFormData = z.infer<typeof updateCreditLedgerSchema>;

export const updateCreditLedgerDefaults: UpdateCreditLedgerFormData = {
  status: "clear" as CreditStatus,
  outstandingCredit: 0,
  totalCreditIssued: 0,
  totalCreditInvoices: 0,
  creditUntil: "",
  lastCreditAt: "",
  lastCreditClearedAt: "",
};
