/**
 * Sales & Billing Contracts
 * Defines types for sales transactions, invoices, and cart items
 */

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface CartItemWithTotal extends CartItem {
  itemTotal: number;
}

export type PaymentMethod = "cash" | "credit";

export interface Invoice {
  id: string;
  shopName: string;
  shopContact?: string;
  invoiceId: string;
  dateTime: string;
  items: CartItemWithTotal[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  dueAmount?: number;
  itemCount: number;
}

export interface SalesHistory {
  id: string;
  invoiceId: string;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  itemCount: number;
  customerName?: string;
}

export interface CreateSaleRequest {
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  dueAmount?: number;
}

export interface SalesHistoryResponse {
  sales: SalesHistory[];
}

export interface CreateSaleResponse {
  invoice: Invoice;
  success: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalCredit: number;
  dueAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
}
