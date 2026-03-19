/**
 * Dashboard mappers
 * Transform backend data to UI models
 */

import type { GeneratedReport } from '../contracts/dashboard';

/**
 * Format timestamp for display
 */
export const formatReportDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Get report type label
 */
export const getReportTypeLabel = (type: GeneratedReport['type']): string => {
  const labels: Record<GeneratedReport['type'], string> = {
    sales: 'Sales Report',
    inventory: 'Inventory Report',
    customer: 'Customer Report',
    daily_summary: 'Daily Summary',
  };
  return labels[type];
};

/**
 * Get report status color/badge
 */
export const getReportStatusBadge = (status: GeneratedReport['status']): { label: string; color: string } => {
  const badges = {
    queued: { label: 'Queued', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    completed: { label: 'Completed', color: 'bg-green-500/15 text-green-700 dark:text-green-300' },
    processing: { label: 'Processing', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
    failed: { label: 'Failed', color: 'bg-destructive/15 text-destructive' },
  };
  return badges[status];
};
