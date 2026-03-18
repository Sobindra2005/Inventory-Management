/**
 * KPI Card Component
 * Displays a single KPI metric with icon and value
 */

import React from 'react';

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
  trend,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 animate-pulse">
        <div className="h-10 w-12 bg-muted rounded-lg mb-4" />
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="h-8 w-32 bg-muted/70 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow duration-300">
      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        {trend && (
          <div
            className={`flex items-center text-sm font-semibold ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-muted-foreground font-medium mb-2">{label}</p>

      {/* Value */}
      <p className="text-3xl font-bold mb-1">{value}</p>

      {/* Subtext */}
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
};
