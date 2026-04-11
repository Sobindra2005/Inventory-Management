export type CreditStatus = "clear" | "due" | "overdue";

export interface CustomerCreditProfile {
  id: string;
  customerId?: string;
  name: string;
  email?: string;
  phone?: string;
  totalCreditIssued: number;
  outstandingCredit: number;
  totalCreditInvoices: number;
  lastCreditAt?: string;
  lastCreditClearedAt?: string;
  creditUntil?: string;
  status: CreditStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreditSummary {
  totalCustomers: number;
  customersWithDue: number;
  totalOutstanding: number;
  overdueCustomers: number;
}

export interface CustomerCreditListResponse {
  customers: CustomerCreditProfile[];
  summary: CustomerCreditSummary;
}

export interface UpdateCreditLedgerRequest {
  status: CreditStatus;
  outstandingCredit: number;
  totalCreditIssued: number;
  totalCreditInvoices: number;
  creditUntil?: string | null;
  lastCreditAt?: string | null;
  lastCreditClearedAt?: string | null;
}
