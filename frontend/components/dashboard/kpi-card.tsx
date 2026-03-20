/**
 * KPI Card Component
 * Displays a single KPI metric with icon and value
 */

import React from 'react';
import { motion } from 'motion/react';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  isLoading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  icon,
  label,
  value,
  subtext,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
        </div>
        <div className="h-8 w-24 bg-muted/70 rounded" />
        <div className="mt-2 h-3 w-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 * 0.04 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </motion.div>
  );
};
