"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, FlaskConical, Users } from "lucide-react";
import { useClearData, useSeedData, useSeedStatus } from "@/lib/queries/use-seed-query";
import {
  seedSettingsDefaults,
  seedSettingsSchema,
  type SeedSettingsFormData,
} from "@/lib/forms/seed-settings";

export function SeedDataSettings() {
  const seedStatusQuery = useSeedStatus();
  const seedMutation = useSeedData();
  const clearMutation = useClearData();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeedSettingsFormData>({
    resolver: zodResolver(seedSettingsSchema),
    defaultValues: seedSettingsDefaults,
  });

  const isBusy = isSubmitting || seedMutation.isPending || clearMutation.isPending;

  const lastActionMessage = useMemo(() => {
    if (seedMutation.isSuccess) {
      return seedMutation.data.message;
    }

    if (clearMutation.isSuccess) {
      return clearMutation.data.message;
    }

    return null;
  }, [clearMutation.data, clearMutation.isSuccess, seedMutation.data, seedMutation.isSuccess]);

  const onSeedSubmit = async (values: SeedSettingsFormData) => {
    await seedMutation.mutateAsync(values);
  };

  const handleSeedCustomersOnly = async () => {
    await seedMutation.mutateAsync({
      numProducts: 0,
      numCustomers: 50,
      numInvoices: 0,
    });
  };

  const handleResetSeededData = async () => {
    const hasData = seedStatusQuery.data?.hasData;

    if (!hasData) {
      return;
    }

    const confirmed = window.confirm("Clear all sample data? This removes products, customers, and invoices.");
    if (!confirmed) {
      return;
    }

    await clearMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Sample Data Controls</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Seed demo records again any time or reset everything to start fresh.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground">Products</p>
            <p className="mt-1 text-2xl font-semibold">
              {seedStatusQuery.data?.recordCounts.products ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground">Customers</p>
            <p className="mt-1 text-2xl font-semibold">
              {seedStatusQuery.data?.recordCounts.customers ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground">Invoices</p>
            <p className="mt-1 text-2xl font-semibold">
              {seedStatusQuery.data?.recordCounts.invoices ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Seed Full Sample Dataset</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set exact counts for products, customers, and invoices.
        </p>

        <form onSubmit={handleSubmit(onSeedSubmit)} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Products (0-500)</label>
              <input
                type="number"
                min={0}
                max={500}
                {...register("numProducts")}
                disabled={isBusy}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {errors.numProducts && (
                <p className="mt-1 text-xs text-destructive">{errors.numProducts.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Customers (0-200)</label>
              <input
                type="number"
                min={0}
                max={200}
                {...register("numCustomers")}
                disabled={isBusy}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {errors.numCustomers && (
                <p className="mt-1 text-xs text-destructive">{errors.numCustomers.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Invoices (0-500)</label>
              <input
                type="number"
                min={0}
                max={500}
                {...register("numInvoices")}
                disabled={isBusy}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {errors.numInvoices && (
                <p className="mt-1 text-xs text-destructive">{errors.numInvoices.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            {seedMutation.isPending ? "Seeding..." : "Seed Sample Data"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Quick Actions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Useful shortcuts for customer seeding and full reset.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeedCustomersOnly}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Users className="h-4 w-4" />
            Seed Customers Only
          </button>

          <button
            type="button"
            onClick={handleResetSeededData}
            disabled={isBusy || !seedStatusQuery.data?.hasData}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {clearMutation.isPending ? "Resetting..." : "Reset Sample Data"}
          </button>
        </div>

        {lastActionMessage && (
          <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            {lastActionMessage}
          </p>
        )}
      </div>
    </div>
  );
}
