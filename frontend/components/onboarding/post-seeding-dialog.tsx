/**
 * Post-seeding confirmation dialog
 * Allows user to keep or discard seeded data after successful seed
 */

"use client";

import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface PostSeedingDialogProps {
  open: boolean;
  seedingSummary?: {
    productsCreated: number;
    customersCreated: number;
    invoicesCreated: number;
    totalRecords: number;
  };
  onKeep: () => void | Promise<void>;
  onDiscard: () => void | Promise<void>;
  isLoading?: boolean;
}

export function PostSeedingDialog({
  open,
  seedingSummary,
  onKeep,
  onDiscard,
  isLoading = false,
}: PostSeedingDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-auto px-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold">Sample Data Loaded!</h2>
              <p className="text-xs text-muted-foreground">
                Your sample dataset is ready to explore
              </p>
            </div>
          </div>

          {/* Summary */}
          {seedingSummary && (
            <div className="space-y-2 bg-accent/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Products</p>
                  <p className="text-lg font-semibold">
                    {seedingSummary.productsCreated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Customers</p>
                  <p className="text-lg font-semibold">
                    {seedingSummary.customersCreated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Invoices</p>
                  <p className="text-lg font-semibold">
                    {seedingSummary.invoicesCreated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {seedingSummary.totalRecords.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Would you like to continue with this sample data to explore all features? You can 
            always clear it later.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDiscard}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive disabled:opacity-50 cursor-pointer transition-colors text-sm font-medium"
            >
              {isLoading ? "Clearing..." : "Clear Data"}
            </button>
            <button
              onClick={onKeep}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 cursor-pointer transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Keep Sample Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
