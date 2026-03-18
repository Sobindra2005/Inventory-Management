"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, IndianRupee, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCustomerCreditList } from "@/lib/queries/use-customers-credit-query";
import type { CreditStatus, CustomerCreditProfile } from "@/lib/contracts/customers";

const formatMoney = (value: number) => `Rs.${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClasses: Record<CreditStatus, string> = {
  clear: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  due: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  overdue: "bg-destructive/15 text-destructive",
};

export const CustomersCreditManager: React.FC = () => {
  const customerCreditQuery = useCustomerCreditList();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CreditStatus>("all");

  const summary = customerCreditQuery.data?.summary;
  const customers = customerCreditQuery.data?.customers ?? [];

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !term ||
        customer.name.toLowerCase().includes(term) ||
        (customer.phone?.toLowerCase().includes(term) ?? false) ||
        (customer.email?.toLowerCase().includes(term) ?? false);

      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const kpis = [
    {
      title: "Total Customers",
      value: summary?.totalCustomers ?? 0,
      icon: Users,
      sub: "With credit profile",
    },
    {
      title: "Customers With Due",
      value: summary?.customersWithDue ?? 0,
      icon: CalendarClock,
      sub: "Active due balance",
    },
    {
      title: "Outstanding Credit",
      value: formatMoney(summary?.totalOutstanding ?? 0),
      icon: IndianRupee,
      sub: "Total receivable",
    },
    {
      title: "Overdue Customers",
      value: summary?.overdueCustomers ?? 0,
      icon: AlertTriangle,
      sub: "Needs follow up",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Credit tracking and customer dues overview.</p>
      </div>

      {customerCreditQuery.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load live customer credit data. Demo fallback may be disabled.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.title}</p>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Search customer</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, phone, email"
                className="h-10 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div className="w-full lg:w-52">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Credit status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CreditStatus)}
              className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All</option>
              <option value="clear">Clear</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outstanding</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Credit</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credit Invoices</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Credit Time</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credit Till</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customerCreditQuery.isLoading && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-sm text-muted-foreground">
                    Loading customers...
                  </td>
                </tr>
              )}

              {!customerCreditQuery.isLoading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-sm text-muted-foreground">
                    No customers match your filters.
                  </td>
                </tr>
              )}

              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-accent/40">
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.phone || customer.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[customer.status]}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-foreground">{formatMoney(customer.outstandingCredit)}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatMoney(customer.totalCreditIssued)}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{customer.totalCreditInvoices}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatDateTime(customer.lastCreditAt)}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(customer.creditUntil)}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatDateTime(customer.lastCreditClearedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
