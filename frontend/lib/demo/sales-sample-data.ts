/**
 * Sales Demo Sample Data
 * Provides fallback demo data for sales and billing when API is unavailable
 */

import type { SalesHistory, Invoice } from "@/lib/contracts/sales";

export const salesHistorySampleData: SalesHistory[] = [
  // Today
  {
    id: "sale-1",
    invoiceId: "INV-20260318-001",
    total: 580.00,
    paymentMethod: "credit",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    itemCount: 3,
    customerName: "John Smith",
  },
  {
    id: "sale-2",
    invoiceId: "INV-20260318-002",
    total: 245.50,
    paymentMethod: "cash",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    itemCount: 2,
  },
  {
    id: "sale-3",
    invoiceId: "INV-20260318-003",
    total: 890.00,
    paymentMethod: "credit",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    itemCount: 5,
    customerName: "Jane Doe",
  },
  // Yesterday
  {
    id: "sale-4",
    invoiceId: "INV-20260317-001",
    total: 654.25,
    paymentMethod: "cash",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    itemCount: 4,
  },
  {
    id: "sale-5",
    invoiceId: "INV-20260317-002",
    total: 1200.00,
    paymentMethod: "credit",
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    itemCount: 6,
    customerName: "Bob Johnson",
  },
  // 2 days ago
  {
    id: "sale-6",
    invoiceId: "INV-20260316-001",
    total: 420.75,
    paymentMethod: "cash",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    itemCount: 3,
  },
];

export const invoiceSampleData: Invoice = {
  id: "inv-1",
  shopName: "POS Store",
  shopContact: "+1 (555) 123-4567",
  invoiceId: "INV-20260318-003",
  dateTime: new Date().toISOString(),
  items: [
    {
      productId: "prod-1",
      name: "Barcode Scanner",
      price: 250.00,
      quantity: 1,
      stock: 8,
      itemTotal: 250.00,
    },
    {
      productId: "prod-2",
      name: "Receipt Paper (10-pack)",
      price: 45.00,
      quantity: 2,
      stock: 18,
      itemTotal: 90.00,
    },
    {
      productId: "prod-3",
      name: "Drawer Lock",
      price: 35.00,
      quantity: 4,
      stock: 2,
      itemTotal: 140.00,
    },
    {
      productId: "prod-4",
      name: "Label Rolls",
      price: 28.50,
      quantity: 3,
      stock: 22,
      itemTotal: 85.50,
    },
    {
      productId: "prod-5",
      name: "A4 Paper (500 sheets)",
      price: 8.00,
      quantity: 2,
      stock: 41,
      itemTotal: 16.00,
    },
  ],
  subtotal: 581.50,
  discount: 50.00,
  total: 531.50,
  paymentMethod: "credit",
  customerId: "cust-1",
  customerName: "Jane Doe",
  dueAmount: 531.50,
  itemCount: 5,
};
