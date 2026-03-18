/**
 * Reports List Component
 * Displays generated reports with download functionality
 */

import React from 'react';
import type { GeneratedReport } from '@/lib/contracts/dashboard';
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
  isDownloading?: boolean;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  onDownload,
  isLoading,
  isDownloading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
        <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/70 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-8 text-center">
        <div className="text-4xl mb-3">📄</div>
        <h3 className="text-lg font-semibold mb-1">No Reports Yet</h3>
        <p className="text-sm text-muted-foreground">Generate your first report using the form on the left.</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
      {/* Header */}
      <h3 className="text-lg font-bold mb-6">Generated Reports</h3>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Report Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Generated
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Size
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.map((report) => {
              const statusBadge = getReportStatusBadge(report.status);
              const canDownload = report.status === 'completed' && report.fileUrl;

              return (
                <tr key={report.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <p className="font-medium">{getReportTypeLabel(report.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.dateRange.startDate).toLocaleDateString()} -{' '}
                          {new Date(report.dateRange.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm">{formatReportDate(report.generatedAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-muted-foreground">{formatFileSize(report.fileSize)}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {canDownload ? (
                      <button
                        onClick={() => onDownload(report.id)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            ⬇️ Download
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
