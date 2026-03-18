/**
 * Low Stock Products Section
 * Displays products that are running low on inventory
 */

import React from 'react';
import type { LowStockProduct } from '@/lib/contracts/dashboard';

interface LowStockSectionProps {
  products: LowStockProduct[];
  criticalCount: number;
  isLoading?: boolean;
}

export const LowStockSection: React.FC<LowStockSectionProps> = ({
  products,
  criticalCount,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
        <div className="h-6 w-48 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/70 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-green-500/10 rounded-xl shadow-sm border border-green-500/30 p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-1">All Stock Levels Healthy</h3>
        <p className="text-sm text-green-700/90 dark:text-green-300/90">No products are running low on inventory.</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">⚠️ Attention Required</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {criticalCount} critical, {products.length} total low stock items
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="dashboard-scrollbar space-y-3 max-h-96 overflow-y-auto [scrollbar-gutter:stable]">
        {products.map((product) => {
          const stockPercentage = (product.currentStock / product.minThreshold) * 100;
          const isCritical = stockPercentage < 25;

          return (
            <div
              key={product.id}
              className={`p-4 rounded-lg border transition-colors ${
                isCritical
                  ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/15'
                  : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  {product.category && (
                    <p className="text-xs text-muted-foreground">Category: {product.category}</p>
                  )}
                </div>
                {isCritical && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                    Critical
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    <span className={isCritical ? 'text-red-600' : 'text-yellow-600'}>
                      {product.currentStock}
                    </span>
                    /{product.minThreshold} units
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round(stockPercentage)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCritical ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {product.lastRestocked && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last restocked: {new Date(product.lastRestocked).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <button className="w-full mt-4 py-2 px-4 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors">
        Manage Inventory →
      </button>
    </div>
  );
};
