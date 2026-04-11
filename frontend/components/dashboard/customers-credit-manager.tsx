"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, IndianRupee, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCustomerCreditList, useUpdateCreditLedgerDetails } from "@/lib/queries/use-customers-credit-query";
import type { CreditStatus } from "@/lib/contracts/customers";
import { CustomSelect } from "@/components/ui/custom-select";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  updateCreditLedgerDefaults,
  updateCreditLedgerSchema,
  type UpdateCreditLedgerFormData,
} from "@/lib/forms/customers";
import { requestPopupConfirm, showPopupMessage } from "@/lib/ui/popup-message";

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

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const toDateTimeInputValue = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const statusClasses: Record<CreditStatus, string> = {
  clear: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  due: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  overdue: "bg-destructive/15 text-destructive",
};

const creditStatusOptions: Array<{ value: "all" | CreditStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "clear", label: "Clear" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
];

export const CustomersCreditManager: React.FC = () => {
  const customerCreditQuery = useCustomerCreditList();
  const updateLedgerMutation = useUpdateCreditLedgerDetails();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CreditStatus>("all");
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCreditLedgerFormData>({
    resolver: zodResolver(updateCreditLedgerSchema),
    defaultValues: updateCreditLedgerDefaults,
  });

  const selectedEditStatus = watch("status");

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

  const editingCustomer = useMemo(
    () => filteredCustomers.find((customer) => customer.id === editingLedgerId) ?? null,
    [editingLedgerId, filteredCustomers],
  );

  const openEditModal = (ledgerId: string, values: {
    status: CreditStatus;
    outstandingCredit: number;
    totalCreditIssued: number;
    totalCreditInvoices: number;
    creditUntil?: string;
    lastCreditAt?: string;
    lastCreditClearedAt?: string;
  }) => {
    setEditingLedgerId(ledgerId);
    reset({
      status: values.status,
      outstandingCredit: values.outstandingCredit,
      totalCreditIssued: values.totalCreditIssued,
      totalCreditInvoices: values.totalCreditInvoices,
      creditUntil: toDateInputValue(values.creditUntil),
      lastCreditAt: toDateTimeInputValue(values.lastCreditAt),
      lastCreditClearedAt: toDateTimeInputValue(values.lastCreditClearedAt),
    });
  };

  const closeEditModal = () => {
    setEditingLedgerId(null);
    reset(updateCreditLedgerDefaults);
  };

  const onSubmitLedgerUpdate = async (data: UpdateCreditLedgerFormData) => {
    if (!editingLedgerId) {
      return;
    }

    const confirmed = await requestPopupConfirm({
      title: "Update Credit Ledger",
      message: "Save credit ledger changes?",
      confirmLabel: "Save",
      cancelLabel: "Cancel",
    });
    if (!confirmed) {
      return;
    }

    try {
      await updateLedgerMutation.mutateAsync({
        ledgerId: editingLedgerId,
        payload: {
          status: data.status,
          outstandingCredit: data.outstandingCredit,
          totalCreditIssued: data.totalCreditIssued,
          totalCreditInvoices: data.totalCreditInvoices,
          creditUntil: data.creditUntil || null,
          lastCreditAt: data.lastCreditAt || null,
          lastCreditClearedAt: data.lastCreditClearedAt || null,
        },
      });
      showPopupMessage({ message: "Credit ledger updated.", variant: "info" });
      closeEditModal();
    } catch (error) {
      console.error("Failed to update credit ledger:", error);
      showPopupMessage({ message: "Failed to update credit ledger.", variant: "error" });
    }
  };

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
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            icon={<kpi.icon className="h-4 w-4" />}
            label={kpi.title}
            value={kpi.value}
            subtext={kpi.sub}
            isLoading={customerCreditQuery.isLoading}
          />
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
            <CustomSelect
              label="Credit status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as "all" | CreditStatus)}
              options={creditStatusOptions}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-280">
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
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customerCreditQuery.isLoading && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-sm text-muted-foreground">
                    Loading customers...
                  </td>
                </tr>
              )}

              {!customerCreditQuery.isLoading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-sm text-muted-foreground">
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
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        openEditModal(customer.id, {
                          status: customer.status,
                          outstandingCredit: customer.outstandingCredit,
                          totalCreditIssued: customer.totalCreditIssued,
                          totalCreditInvoices: customer.totalCreditInvoices,
                          creditUntil: customer.creditUntil,
                          lastCreditAt: customer.lastCreditAt,
                          lastCreditClearedAt: customer.lastCreditClearedAt,
                        });
                      }}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Update Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingLedgerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Update Credit Ledger</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update credit ledger details for {editingCustomer?.name ?? "this customer"}.
            </p>

            <form onSubmit={handleSubmit(onSubmitLedgerUpdate)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                <label className="mb-2 block text-sm font-medium">Outstanding Credit</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("outstandingCredit", { valueAsNumber: true })}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.outstandingCredit && <p className="mt-1 text-xs text-destructive">{errors.outstandingCredit.message}</p>}
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">Total Credit Issued</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("totalCreditIssued", { valueAsNumber: true })}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.totalCreditIssued && <p className="mt-1 text-xs text-destructive">{errors.totalCreditIssued.message}</p>}
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">Total Credit Invoices</label>
                <input
                  type="number"
                  step="1"
                  min={0}
                  {...register("totalCreditInvoices", { valueAsNumber: true })}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.totalCreditInvoices && <p className="mt-1 text-xs text-destructive">{errors.totalCreditInvoices.message}</p>}
                </div>

                <div>
                <CustomSelect
                  label="Status"
                  value={selectedEditStatus}
                  onChange={(value) => setValue("status", value as CreditStatus, { shouldValidate: true, shouldDirty: true })}
                  options={[
                    { value: "clear", label: "Clear" },
                    { value: "due", label: "Due" },
                    { value: "overdue", label: "Overdue" },
                  ]}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                />
                {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status.message}</p>}
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">Credit Till</label>
                <input
                  type="date"
                  {...register("creditUntil")}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">Last Credit Time</label>
                <input
                  type="datetime-local"
                  {...register("lastCreditAt")}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">Last Cleared Time</label>
                <input
                  type="datetime-local"
                  {...register("lastCreditClearedAt")}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateLedgerMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {updateLedgerMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
