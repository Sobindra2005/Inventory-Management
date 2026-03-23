"use client";

import Link from "next/link";
import { Monitor, ArrowLeft, Package } from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopNavbar from "@/components/top-navbar";
import { useRealtimeEvents } from "@/lib/queries/use-realtime-events";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRealtimeEvents();

  return (
    <>
      {/* ─── Mobile: Desktop-Only Notice ─── */}
      <div className="flex md:hidden min-h-screen bg-background text-foreground">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          {/* Floating gradient orbs */}
          <div
            className="absolute top-20 left-[10%] w-56 h-56 bg-indigo-400/15 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"
            style={{ animation: "float 8s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-20 right-[10%] w-64 h-64 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-[80px] pointer-events-none"
            style={{ animation: "float-reverse 10s ease-in-out infinite" }}
          />

          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <Monitor className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-[10px] font-bold text-amber-900">!</span>
            </div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Desktop Experience Only
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xs mb-8">
            StockFlow&apos;s dashboard is optimized for larger screens. Please switch to a desktop or tablet device for the best experience.
          </p>

          {/* Minimum size hint */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 border border-border mb-8">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Minimum width: 768px
            </span>
          </div>

          {/* Back to home link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Branding */}
          <div className="absolute bottom-8 flex items-center gap-2 text-muted-foreground">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">StockFlow</span>
          </div>
        </div>
      </div>

      {/* ─── Desktop: Dashboard ─── */}
      <div className="hidden md:flex h-screen bg-background text-foreground">
        {/* Sidebar - Fixed/Sticky on the left */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar />
          <main className="gutter flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
