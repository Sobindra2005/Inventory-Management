/**
 * Invoice Modal Component
 * Displays a clean thermal-style receipt preview with print and PDF options
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer, Download } from "lucide-react";
import type { Invoice } from "@/lib/contracts/sales";

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF download logic
    console.log("Downloading PDF for invoice:", invoice?.invoiceId);
    alert("PDF download feature coming soon!");
  };

  if (!invoice) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="text-lg font-semibold">Receipt Preview</h2>
              <button
                onClick={onClose}
                className="rounded-lg hover:bg-accent p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Receipt Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 print:p-0 print:bg-white print:text-black space-y-4">
              {/* Thermal Receipt Style Container */}
              <div className="bg-background rounded-lg p-4 font-mono text-sm space-y-4 print:border print:border-black">
                {/* Shop Header */}
                <div className="text-center border-b border-border pb-3">
                  <h3 className="font-bold text-base mb-1">{invoice.shopName}</h3>
                  {invoice.shopContact && (
                    <p className="text-xs text-muted-foreground">{invoice.shopContact}</p>
                  )}
                </div>

                {/* Invoice Details */}
                <div className="text-center text-xs space-y-1 border-b border-border pb-3">
                  <p>
                    <span className="font-semibold">Invoice:</span> {invoice.invoiceId}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span> {formatDate(invoice.dateTime)}
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-2 border-b border-border pb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-semibold py-1">Product</th>
                        <th className="text-right font-semibold py-1">Qty</th>
                        <th className="text-right font-semibold py-1">Price</th>
                        <th className="text-right font-semibold py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.productId} className="border-b border-border/50">
                          <td className="py-1 truncate">{item.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">${item.price.toFixed(2)}</td>
                          <td className="text-right font-semibold">
                            ${item.itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="space-y-1 text-xs border-b border-border pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total:</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="text-xs space-y-1 border-b border-border pb-3">
                  <p className="capitalize font-semibold">
                    Payment: {invoice.paymentMethod === "cash" ? "💵 Cash" : "💳 Credit"}
                  </p>
                  {invoice.paymentMethod === "credit" && invoice.customerName && (
                    <>
                      <p>Customer: {invoice.customerName}</p>
                      {invoice.dueAmount !== undefined && (
                        <p>Due Amount: ${invoice.dueAmount.toFixed(2)}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Message */}
                <div className="text-center text-xs text-muted-foreground italic pt-2">
                  Thank you for your purchase!
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border bg-muted/30 px-6 py-4 flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
