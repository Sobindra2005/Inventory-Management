"use client";

import { useState, useRef, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Package,
  Receipt,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Sparkles,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
} from "motion/react";
import { useHealthQuery } from "@/lib/queries/use-health-query";

/* ────────────────────── Data ────────────────────── */

const features = [
  {
    title: "Real-time Inventory",
    description:
      "Track stock levels across multiple locations with instant updates and low-stock alerts.",
    icon: Package,
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    title: "Precision Billing",
    description:
      "Generate professional invoices in seconds. Manage payments and taxes with ease.",
    icon: Receipt,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Advanced Analytics",
    description:
      "Gain deep insights into your sales performance and inventory turnover with visual reports.",
    icon: BarChart3,
    color: "amber",
    gradient: "from-amber-500 to-amber-600",
  },
];

const stats = [
  { value: "10K+", label: "Products Tracked", icon: Package },
  { value: "99.9%", label: "Uptime", icon: Shield },
  { value: "3x", label: "Faster Billing", icon: Zap },
  { value: "500+", label: "Active Businesses", icon: Users },
];

const steps = [
  {
    number: "01",
    title: "Connect your store",
    description:
      "Sign up and connect your inventory sources in minutes. Import existing data effortlessly.",
    icon: Zap,
  },
  {
    number: "02",
    title: "Manage everything",
    description:
      "Track inventory, generate bills, and monitor analytics all from one unified dashboard.",
    icon: Package,
  },
  {
    number: "03",
    title: "Scale with confidence",
    description:
      "As your business grows, StockFlow scales with you. No limits, no slowdowns.",
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Operations Manager, GreenLeaf Retail",
    quote:
      "StockFlow cut our inventory discrepancies by 85%. The real-time alerts alone saved us thousands.",
    avatar: "PS",
    rating: 5,
  },
  {
    name: "David Chen",
    role: "Founder, UrbanMart",
    quote:
      "The billing system is incredibly fast. We went from 10 minutes per invoice to under 30 seconds.",
    avatar: "DC",
    rating: 5,
  },
  {
    name: "Sofia Martinez",
    role: "CFO, BrightPath Wholesale",
    quote:
      "The analytics dashboard gives us insights we never had before. Game-changing for our forecasting.",
    avatar: "SM",
    rating: 5,
  },
];

/* ────────────────── Animated Counter ────────────── */

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(value);
  const hasAnimated = useRef(false);

  const numericMatch = value.match(/^([\d.]+)(.*)$/);

  useEffect(() => {
    if (!isInView || !numericMatch || hasAnimated.current) return;
    hasAnimated.current = true;

    const target = parseFloat(numericMatch[1]);
    const suffix = numericMatch[2];
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (target >= 100) {
        setDisplayed(Math.round(current).toLocaleString() + suffix);
      } else if (target >= 10) {
        setDisplayed(current.toFixed(progress >= 1 ? 1 : 0) + suffix);
      } else {
        setDisplayed(current.toFixed(1) + suffix);
      }

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView]);

  return <span ref={ref}>{displayed}</span>;
}

/* ────────────────── Main Page ────────────────── */

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const healthQuery = useHealthQuery({ enabled: isLoaded });

  // Scroll-aware navbar
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  if (!isLoaded) return null;

  const handleDashboardAccess = () => {
    if (userId) {
      router.push("/dashboard");
      return;
    }
    setShowSignIn(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300">
      {/* ─── Navbar ─── */}
      <motion.nav
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex justify-between items-center transition-all duration-300 ${
              scrolled ? "h-14" : "h-18"
            }`}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                StockFlow
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5" />
                )}
              </button>

              {userId ? (
                <Link
                  href="/dashboard"
                  className="bg-foreground text-background px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  onClick={handleDashboardAccess}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 grid-bg" />

        {/* Floating orbs */}
        <div
          className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-[100px]"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-20 right-[10%] w-80 h-80 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-[100px]"
          style={{ animation: "float-reverse 10s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-[120px]"
          style={{ animation: "pulse-glow 6s ease-in-out infinite" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 mb-8"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                New: AI-Powered Inventory Insights
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]"
            >
              Inventory management{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300">
                reimagined.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed font-light max-w-2xl mx-auto"
            >
              The ultimate toolkit for modern businesses. Effortlessly track
              inventory, generate professional bills, and scale your operations
              with StockFlow.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleDashboardAccess}
                className="w-full sm:w-auto bg-foreground text-background px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2.5 group shadow-2xl shadow-foreground/10"
              >
                Start for free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="#features"
                className="w-full sm:w-auto bg-card text-muted-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:text-foreground border border-border hover:border-foreground/20 transition-all"
              >
                See how it works
              </Link>
            </motion.div>
          </div>

          {/* ─── Dashboard Preview ─── */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 lg:mt-24 relative max-w-5xl mx-auto"
          >
            {/* Glow behind preview */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground border border-border">
                    app.stockflow.io/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 lg:p-8">
                {/* Stat cards row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      label: "Total Revenue",
                      value: "$48,520",
                      change: "+12.5%",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Products",
                      value: "1,284",
                      change: "+24",
                      color: "text-indigo-500",
                    },
                    {
                      label: "Orders Today",
                      value: "342",
                      change: "+8.2%",
                      color: "text-amber-500",
                    },
                    {
                      label: "Active Users",
                      value: "89",
                      change: "+3",
                      color: "text-violet-500",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-background border border-border rounded-xl p-4"
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className={`text-xs font-medium ${stat.color} mt-1`}>
                        {stat.change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart + Table row */}
                <div className="grid lg:grid-cols-5 gap-4">
                  {/* Simulated chart area */}
                  <div className="lg:col-span-3 bg-background border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-foreground">
                        Revenue Overview
                      </p>
                      <div className="flex gap-2">
                        {["7D", "1M", "3M"].map((t) => (
                          <span
                            key={t}
                            className={`text-xs px-2.5 py-1 rounded-md cursor-pointer ${
                              t === "1M"
                                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* SVG chart bars */}
                    <div className="flex items-end gap-2 h-32">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-400 rounded-t-sm opacity-80"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Recent orders */}
                  <div className="lg:col-span-2 bg-background border border-border rounded-xl p-5">
                    <p className="text-sm font-semibold text-foreground mb-4">
                      Recent Orders
                    </p>
                    <div className="space-y-3">
                      {[
                        { id: "#4521", item: "Widget Pro", status: "Shipped" },
                        { id: "#4520", item: "Gadget X", status: "Processing" },
                        { id: "#4519", item: "Module Z", status: "Delivered" },
                        { id: "#4518", item: "Part Alpha", status: "Pending" },
                      ].map((order, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground font-mono">
                            {order.id}
                          </span>
                          <span className="text-foreground">{order.item}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              order.status === "Shipped"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : order.status === "Delivered"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : order.status === "Processing"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 mb-4">
                  <stat.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Features Section (Bento Grid) ─── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4 tracking-wider uppercase">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                grow
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Manage your shop, warehouse, or e-commerce business with powerful
              tools built for speed and simplicity.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative bg-card rounded-2xl border border-border p-8 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 ${
                    i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""
                  }`}
                >
                  {/* Gradient hover overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/20 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>

                    {i === 0 && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {[
                          "Multi-location",
                          "Low-stock Alerts",
                          "Batch Import",
                          "Barcode Scan",
                        ].map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 lg:py-32 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4 tracking-wider uppercase">
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Up and running in minutes
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-lg mb-6 relative z-10">
                    <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-2">
                    Step {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4 tracking-wider uppercase">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Loved by businesses worldwide
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <p className="text-foreground leading-relaxed mb-6 font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mesh-gradient rounded-[2rem] p-12 lg:p-16 text-center relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div
              className="absolute top-6 right-12 w-20 h-20 border border-white/10 rounded-full"
              style={{ animation: "spin-slow 20s linear infinite" }}
            />
            <div
              className="absolute bottom-8 left-10 w-16 h-16 border border-white/10 rounded-xl rotate-45"
              style={{ animation: "float 6s ease-in-out infinite" }}
            />
            <div className="absolute top-1/2 right-[15%] w-2 h-2 bg-white/30 rounded-full" style={{ animation: "pulse-glow 3s ease infinite" }} />
            <div className="absolute top-[30%] left-[20%] w-1.5 h-1.5 bg-white/20 rounded-full" style={{ animation: "pulse-glow 4s ease infinite 1s" }} />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to streamline
                <br />
                your business?
              </h2>
              <p className="text-indigo-100 mb-10 text-lg max-w-xl mx-auto">
                Join thousands of businesses that trust StockFlow for their
                inventory and billing needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleDashboardAccess}
                  className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-2xl shadow-black/20 flex items-center gap-2 group"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-muted/30 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  StockFlow
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Modern inventory management and billing for growing businesses.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Twitter, label: "Twitter" },
                  { icon: Github, label: "GitHub" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Integrations", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Security", "Support"],
              },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold text-foreground mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 StockFlow Inc. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <span className="text-red-500">❤️</span> for modern businesses
            </p>
          </div>
        </div>
      </footer>

      {/* ─── Sign-In Modal ─── */}
      {showSignIn && !userId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSignIn(false)}
          />
          <div className="relative bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-zinc-800">
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
                    socialButtonsBlockButton:
                      "bg-white dark:bg-zinc-900 border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    footerActionText: "text-zinc-600 dark:text-zinc-400",
                    footerActionLink: "text-indigo-600 hover:text-indigo-700",
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
