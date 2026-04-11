/**
 * Reports List Component
 * Displays generated reports with download functionality
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { GeneratedReport } from '@/lib/contracts/dashboard';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  formatReportDate,
  formatFileSize,
  getReportTypeLabel,
  getReportStatusBadge,
} from '@/lib/mappers/dashboard-mappers';

interface ReportsListProps {
  reports: GeneratedReport[];
  onDownload: (reportId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  onDownload,
  isLoading,
}) => {
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const handleDownload = useCallback(async (reportId: string) => {
    setDownloadingReportId(reportId);
    try {
      await onDownload(reportId);
    } finally {
      setDownloadingReportId(null);
    }
  }, [onDownload]);

  const reportColumns = useMemo<DataTableColumn<GeneratedReport>[]>(
    () => [
      {
        id: 'type',
        header: 'Report Type',
        cell: (report) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xl">📊</span>
            <div className="min-w-0">
              <p className="truncate font-medium">{getReportTypeLabel(report.type)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(report.dateRange.startDate).toLocaleDateString()} - {new Date(report.dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'generated',
        header: 'Generated',
        cell: (report) => <p className="whitespace-nowrap">{formatReportDate(report.generatedAt)}</p>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (report) => {
          const statusBadge = getReportStatusBadge(report.status);
          return (
            <span className={`inline-flex min-w-24 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          );
        },
      },
      {
        id: 'size',
        header: 'Size',
        cell: (report) => <p className="whitespace-nowrap text-muted-foreground">{formatFileSize(report.fileSize)}</p>,
      },
      {
        id: 'action',
        header: 'Action',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: (report) => {
          const canDownload = report.status === 'completed' && report.fileUrl;
          const isDownloading = downloadingReportId === report.id;

          if (!canDownload) {
            return <span className="inline-flex w-32 justify-center text-sm text-muted-foreground">—</span>;
          }

          return (
            <button
              onClick={() => handleDownload(report.id)}
              disabled={isDownloading}
              className="inline-flex w-32 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Downloading
                </>
              ) : (
                <>
                  <span>⬇️</span>
                  Download
                </>
              )}
            </button>
          );
        },
      },
    ],
    [downloadingReportId, handleDownload],
  );

  return (
    <DataTable
      title="Generated Reports"
      subtitle="View report status and download completed files."
      columns={reportColumns}
      rows={reports}
      rowKey={(report) => report.id}
      isLoading={isLoading}
      loadingMessage="Loading reports..."
      emptyMessage="No reports yet. Generate your first report using the form above."
      minWidthClassName="min-w-[900px]"
      tableClassName="table-fixed"
      rowClassName={() => 'hover:bg-accent/50 transition-colors'}
    />
  );
};
