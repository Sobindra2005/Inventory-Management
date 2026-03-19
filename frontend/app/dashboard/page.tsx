/**
 * Dashboard Page - KPI Cards, Low Stock, Reports
 */

"use client";

import React from "react";
import { IndianRupee, Package, ReceiptText, Wallet } from "lucide-react";
import {
  useDashboardData,
  useLowStockProducts,
  useReports,
  useGenerateReport,
  useDownloadReport,
} from "@/lib/queries/use-dashboard-query";
import { KPICard } from "@/components/dashboard/kpi-card";
import { LowStockSection } from "@/components/dashboard/low-stock-section";
import { GenerateReportForm } from "@/components/dashboard/generate-report-form";
import { ReportsList } from "@/components/dashboard/reports-list";
import { GenerateReportFormData } from "@/lib/forms/dashboard";

export default function DashboardPage() {
  const dashboardQuery = useDashboardData();
  const lowStockQuery = useLowStockProducts(10);
  const reportsQuery = useReports(10);
  const generateReportMutation = useGenerateReport();
  const downloadReportMutation = useDownloadReport();

  const isLoading = dashboardQuery.isLoading || lowStockQuery.isLoading;
  const isError = dashboardQuery.isError || lowStockQuery.isError;

  const handleGenerateReport = async (data: GenerateReportFormData) => {
    try {
      await generateReportMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      await downloadReportMutation.mutateAsync(reportId);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const currentDate = new Date().toLocaleDateString("en-US", dateOptions);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-background/80 backdrop-blur-md border-b border-border pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here&apos;s your business overview.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto ">
        {/* {isError && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">
              Failed to load dashboard data. Please try refreshing the page.
            </p>
          </div>
        )} */}

        <div className="my-8">
          <h2 className="text-lg font-semibold mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              icon={<IndianRupee className="h-4 w-4" />}
              label="Today's Sales"
              value={`Rs.${dashboardQuery.data?.kpi.todaySales ?? 0}`}
              subtext="Last 24 hours"
              isLoading={isLoading}
            />
            <KPICard
              icon={<Package className="h-4 w-4" />}
              label="Items Sold"
              value={dashboardQuery.data?.kpi.itemsSold ?? 0}
              subtext="Last 24 hours"
              isLoading={isLoading}
            />
            <KPICard
              icon={<ReceiptText className="h-4 w-4" />}
              label="Total Transactions"
              value={dashboardQuery.data?.kpi.totalTransactions ?? 0}
              subtext="Last 24 hours"
              isLoading={isLoading}
            />
            <KPICard
              icon={<Wallet className="h-4 w-4" />}
              label="Cash vs Credit"
              value={
                dashboardQuery.data
                  ? `${dashboardQuery.data.kpi.cashVsCredit.cash}/${dashboardQuery.data.kpi.cashVsCredit.credit}`
                  : "0/0"
              }
              subtext="Cash/Credit ratio"
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Attention
            </h2>
            <LowStockSection
              products={lowStockQuery.data?.products ?? []}
              criticalCount={lowStockQuery.data?.criticalCount ?? 0}
              isLoading={lowStockQuery.isLoading}
            />
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">
              Generate Report
            </h2>
            <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 sticky top-32">
              <GenerateReportForm
                onSubmit={handleGenerateReport}
                isLoading={generateReportMutation.isPending}
              />
              {generateReportMutation.isSuccess && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/15 border border-green-500/30">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Report generated successfully!
                  </p>
                </div>
              )}
              {generateReportMutation.isError && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive">
                    Failed to generate report. Try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <ReportsList
            reports={reportsQuery.data ?? []}
            onDownload={handleDownloadReport}
            isLoading={reportsQuery.isLoading}
            isDownloading={downloadReportMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
