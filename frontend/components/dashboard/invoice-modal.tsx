/**
 * Invoice Modal Component
 * Displays a clean thermal-style receipt preview with print and PDF options
 */

"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Invoice } from "@/lib/contracts/sales";

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  isOpen,
  isLoading = false,
  errorMessage = null,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handlePrint = () => {
    if (!receiptRef.current) {
      return;
    }

    document.body.classList.add("printing-invoice");

    const cleanup = () => {
      document.body.classList.remove("printing-invoice");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !receiptRef.current || isDownloadingPdf) {
      return;
    }

    try {
      setIsDownloadingPdf(true);

      const source = receiptRef.current;
      const canvas = await html2canvas(source, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * printableWidth) / canvas.width;

      let heightLeft = imageHeight;
      let yPosition = margin;

      pdf.addImage(imageData, "PNG", margin, yPosition, printableWidth, imageHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        yPosition = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, yPosition, printableWidth, imageHeight);
        heightLeft -= printableHeight;
      }

      const safeInvoiceId = invoice.invoiceId.replace(/[^a-zA-Z0-9_-]/g, "-");
      pdf.save(`receipt-${safeInvoiceId}.pdf`);
    } catch (error) {
      console.error("Failed to download receipt PDF:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isOpen) return null;

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
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 print:hidden"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="invoice-print-area fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col print:static print:inset-auto print:translate-x-0 print:translate-y-0 print:max-w-none print:max-h-none print:rounded-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4 print:hidden">
            <h2 className="text-lg font-semibold">Receipt Preview</h2>
            <button
              onClick={onClose}
              className="rounded-lg hover:bg-accent p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Receipt Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 print:p-0 print:bg-white print:text-black">
            {isLoading && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 print:bg-white print:text-black print:border-black">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-4/6" />
                <p className="text-xs text-muted-foreground">Loading invoice details...</p>
              </div>
            )}

            {!isLoading && errorMessage && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-destructive print:bg-white print:text-black print:border-black">
                {errorMessage}
              </div>
            )}

            {!isLoading && !errorMessage && !invoice && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground print:bg-white print:text-black print:border-black">
                Invoice details are not available.
              </div>
            )}

            {!isLoading && !errorMessage && invoice && (
              <div
                ref={receiptRef}
                className="invoice-receipt bg-white text-black rounded-xl p-5 font-mono text-sm space-y-4 border print:rounded-none print:border-black"
                style={{ borderColor: "rgba(0, 0, 0, 0.2)" }}
              >
                {/* Shop Header */}
                <div className="text-center border-b border-dashed pb-3" style={{ borderBottomColor: "rgba(0, 0, 0, 0.4)" }}>
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(0, 0, 0, 0.6)" }}>Sales Receipt</p>
                  <h3 className="font-bold text-base mt-1 mb-1">{invoice.shopName}</h3>
                  {invoice.shopContact && (
                    <p className="text-xs" style={{ color: "rgba(0, 0, 0, 0.7)" }}>{invoice.shopContact}</p>
                  )}
                </div>

                {/* Invoice Details */}
                <div className="text-xs space-y-1 border-b border-dashed pb-3" style={{ borderBottomColor: "rgba(0, 0, 0, 0.4)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="uppercase tracking-wide" style={{ color: "rgba(0, 0, 0, 0.6)" }}>Invoice</span>
                    <span className="font-semibold">{invoice.invoiceId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="uppercase tracking-wide" style={{ color: "rgba(0, 0, 0, 0.6)" }}>Date</span>
                    <span>{formatDate(invoice.dateTime)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="uppercase tracking-wide" style={{ color: "rgba(0, 0, 0, 0.6)" }}>Items</span>
                    <span>{invoice.itemCount}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 border-b border-dashed pb-3" style={{ borderBottomColor: "rgba(0, 0, 0, 0.4)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderBottomColor: "rgba(0, 0, 0, 0.3)" }}>
                        <th className="text-left font-semibold py-1">Product</th>
                        <th className="text-right font-semibold py-1">Qty</th>
                        <th className="text-right font-semibold py-1">Price</th>
                        <th className="text-right font-semibold py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={`${item.productId}-${item.name}`} className="border-b" style={{ borderBottomColor: "rgba(0, 0, 0, 0.1)" }}>
                          <td className="py-1 truncate">{item.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">${item.price.toFixed(2)}</td>
                          <td className="text-right font-semibold">
                            Rs.{item.itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="space-y-1 text-xs border-b border-dashed pb-3" style={{ borderBottomColor: "rgba(0, 0, 0, 0.4)" }}>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs.{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>Rs.{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total:</span>
                    <span>Rs.{invoice.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="text-xs space-y-1 border-b border-dashed pb-3" style={{ borderBottomColor: "rgba(0, 0, 0, 0.4)" }}>
                  <p className="capitalize font-semibold">
                    Payment: {invoice.paymentMethod === "cash" ? "💵 Cash" : "💳 Credit"}
                  </p>
                  {invoice.paymentMethod === "credit" && invoice.customerName && (
                    <>
                      <p>Customer: {invoice.customerName}</p>
                      {invoice.dueAmount !== undefined && (
                        <p>Due Amount: Rs.{invoice.dueAmount.toFixed(2)}</p>
                      )}
                      {invoice.creditUntil && (
                        <p>Credit Till: {new Date(invoice.creditUntil).toLocaleDateString("en-US")}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Message */}
                <div className="text-center text-xs italic pt-2" style={{ color: "rgba(0, 0, 0, 0.7)" }}>
                  Thank you for your purchase!
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-border bg-muted/30 px-6 py-4 flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              disabled={!invoice || isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!invoice || isLoading || isDownloadingPdf}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isDownloadingPdf ? "Generating..." : "PDF"}
            </button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
