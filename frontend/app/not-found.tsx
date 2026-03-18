import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopNavbar from "@/components/top-navbar";

export default function NotFound() {
  return (
    <div className="md:flex min-h-screen bg-background text-foreground">
      {/* Sidebar - Fixed/Sticky on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist. It might have been moved or deleted.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
