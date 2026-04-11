/**
 * First-time onboarding dialog for sample data seeding
 * Presents user with option to populate sample data on first visit
 */

"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface OnboardingSampleDataDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onDecline: () => void;
  isLoading?: boolean;
}

export function OnboardingSampleDataDialog({
  open,
  onConfirm,
  onDecline,
  isLoading = false,
}: OnboardingSampleDataDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-auto px-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Welcome to Your Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              This is your first time here. Would you like to explore with sample data?
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 bg-accent/50 rounded-lg p-3">
            <p className="text-xs font-medium text-foreground">Sample Data Includes:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-2">
              <li>✓ 100+ products with categories and pricing</li>
              <li>✓ 50+ customers with contact information</li>
              <li>✓ 150+ sales invoices with realistic transactions</li>
              <li>✓ All relationships properly maintained</li>
            </ul>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            You can always clear this data later from settings if you prefer starting fresh.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDecline}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-foreground disabled:opacity-50 cursor-pointer transition-colors text-sm font-medium"
            >
              Start Empty
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 cursor-pointer transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Seeding..." : "Load Sample Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
