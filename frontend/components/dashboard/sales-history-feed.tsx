/**
 * Sales History Component
 * Displays sales transactions grouped by time (Today, Yesterday, etc.)
 */

"use client";

import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Calendar, TrendingUp, CreditCard, Wallet } from "lucide-react";
import type { SalesHistory } from "@/lib/contracts/sales";
import { InvoiceModal } from "./invoice-modal";
import { useInvoice } from "@/lib/queries/use-sales-query";

interface SalesHistoryProps {
  sales: SalesHistory[];
}

export const SalesHistoryFeed: React.FC<SalesHistoryProps> = ({ sales }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    data: selectedInvoice,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
  } = useInvoice(selectedInvoiceId ?? "");

  // Group sales by date
  const groupedSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, SalesHistory[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    const groupedByDate: Record<string, SalesHistory[]> = {};

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp);
      const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

      if (saleDateOnly.getTime() === today.getTime()) {
        groups.today.push(sale);
      } else if (saleDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(sale);
      } else {
        const dateKey = saleDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(sale);
      }
    });

    return { groups, groupedByDate };
  }, [sales]);

  const handleSaleClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsModalOpen(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const isHighValue = (total: number) => total > 500;
  const isCreditPayment = (method: string) => method === "credit";

  return (
    <div className="space-y-6">
      {/* Today */}
      {groupedSales.groups.today.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Today</h3>
          </div>
          <div className="space-y-2">
            {groupedSales.groups.today.map((sale, index) => (
              <motion.button
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSaleClick(sale.invoiceId)}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors p-3 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {sale.invoiceId}
                  </span>
                  <div className="flex items-center gap-2">
                    {isHighValue(sale.total) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                        <TrendingUp className="w-3 h-3" />
                        High Value
                      </span>
                    )}
                    {isCreditPayment(sale.paymentMethod) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                        <CreditCard className="w-3 h-3" />
                        Credit
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sale.itemCount} items</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">{formatTime(sale.timestamp)}</div>
                  {sale.customerName && (
                    <div className="text-xs text-muted-foreground">• {sale.customerName}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Yesterday */}
      {groupedSales.groups.yesterday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Yesterday</h3>
          </div>
          <div className="space-y-2">
            {groupedSales.groups.yesterday.map((sale, index) => (
              <motion.button
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSaleClick(sale.invoiceId)}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors p-3 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {sale.invoiceId}
                  </span>
                  <div className="flex items-center gap-2">
                    {isHighValue(sale.total) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                        <TrendingUp className="w-3 h-3" />
                        High Value
                      </span>
                    )}
                    {isCreditPayment(sale.paymentMethod) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                        <CreditCard className="w-3 h-3" />
                        Credit
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sale.itemCount} items</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">{formatTime(sale.timestamp)}</div>
                  {sale.customerName && (
                    <div className="text-xs text-muted-foreground">• {sale.customerName}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Older Dates */}
      {Object.entries(groupedSales.groupedByDate).map(([dateKey, dateItems]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{dateKey}</h3>
          </div>
          <div className="space-y-2">
            {dateItems.map((sale, index) => (
              <motion.button
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSaleClick(sale.invoiceId)}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors p-3 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {sale.invoiceId}
                  </span>
                  <div className="flex items-center gap-2">
                    {isHighValue(sale.total) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                        <TrendingUp className="w-3 h-3" />
                        High Value
                      </span>
                    )}
                    {isCreditPayment(sale.paymentMethod) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                        <CreditCard className="w-3 h-3" />
                        Credit
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sale.itemCount} items</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">{formatTime(sale.timestamp)}</div>
                  {sale.customerName && (
                    <div className="text-xs text-muted-foreground">• {sale.customerName}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {sales.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No sales yet. Start creating invoices!</p>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice ?? null}
        isOpen={isModalOpen}
        isLoading={isInvoiceLoading}
        errorMessage={isInvoiceError ? "Failed to load invoice details." : null}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoiceId(null);
        }}
      />
    </div>
  );
};
