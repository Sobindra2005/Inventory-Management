"use client";

import { useState, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Link from "next/link";
import { X, Package, Receipt, BarChart3, ArrowRight, Sun, Moon } from "lucide-react";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showSignIn, setShowSignIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !mounted) return null;

  const features = [
    {
      title: "Real-time Inventory",
      description: "Track stock levels across multiple locations with instant updates and low-stock alerts.",
      icon: <Package className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />,
    },
    {
      title: "Precision Billing",
      description: "Generate professional invoices in seconds. Manage payments and taxes with ease.",
      icon: <Receipt className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      title: "Advanced Analytics",
      description: "Gain deep insights into your sales performance and inventory turnover with visual reports.",
      icon: <BarChart3 className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
    },
  ];

  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">StockFlow</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <ThemeToggle />

              {userId ? (
                <Link
                  href="/dashboard"
                  className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 px-5 py-2 rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="bg-indigo-600 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-shadow hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/20 transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto relative">
            {/* Decorative blobs */}
            <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
            <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl opacity-50 -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-[1.1]">
              Inventory management <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">reimagined.</span>
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-light">
              The ultimate toolkit for modern businesses. Effortlessly track inventory, generate professional bills, and scale your operations with StockFlow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowSignIn(true)}
                className="w-full sm:w-auto bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
              >
                Start for free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="#features"
                className="w-full sm:w-auto bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Hero Image / UI Preview */}
          <div className="mt-20 relative max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              {/* Simulated Dashboard UI */}
              <div className="w-full h-full p-8 flex flex-col gap-6">
                <div className="h-8 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse"></div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="h-32 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse"></div>
                  <div className="h-32 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-32 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <div className="flex-1 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
              {/* Overlay text */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-[2px]">
                <span className="bg-white/90 dark:bg-zinc-800/90 px-6 py-2 rounded-full text-sm font-medium border border-white/50 dark:border-zinc-700 shadow-lg text-zinc-900 dark:text-zinc-100">Coming soon: Smart AI Reordering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Powerful features for high-growth teams</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Everything you need to manage your shop, warehouse, or e-commerce business in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors group">
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to streamline your business?</h2>
            <p className="text-indigo-100 mb-10 text-lg max-w-xl mx-auto">Join thousands of businesses that trust StockFlow for their inventory and billing needs.</p>
            <button
              onClick={() => setShowSignIn(true)}
              className="bg-white text-indigo-600 dark:text-indigo-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-zinc-50 transition-colors shadow-xl"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">StockFlow</span>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Support</Link>
            </div>
            <p>© 2026 StockFlow Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign-In Modal Overlay */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSignIn(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-transparent dark:border-zinc-800">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors z-10 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8 pt-12 flex justify-center">
              <SignIn
                routing="hash"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  baseTheme: resolvedTheme === "dark" ? dark : undefined,
                  elements: {
                    card: "bg-white dark:bg-zinc-950 shadow-none border-0",
                    headerTitle: "text-zinc-900 dark:text-zinc-50",
                    headerSubtitle: "text-zinc-600 dark:text-zinc-400",
                    socialButtonsBlockButton: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    footerActionText: "text-zinc-600 dark:text-zinc-400",
                    footerActionLink: "text-indigo-600 hover:text-indigo-700",
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
