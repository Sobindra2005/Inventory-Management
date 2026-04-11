/**
 * useOnboarding hook
 * Manages the complete first-time user onboarding flow
 */

"use client";

import { useEffect, useState } from "react";
import { useSeedData, useClearData, useSeedStatus } from "@/lib/queries/use-seed-query";
import {
  isFirstTimeUser,
  markOnboardingCompleted,
} from "@/lib/utils/onboarding";
import type { SeedDataResponse, ClearDataResponse } from "@/lib/api/seed";

export type OnboardingStep = "idle" | "initial-dialog" | "seeding" | "post-seeding-dialog";

interface UseOnboardingOptions {
  /**
   * Automatically show dialog on mount if first time user
   * @default true
   */
  autoShow?: boolean;
  /**
   * Custom seed options
   */
  seedOptions?: {
    numProducts?: number;
    numCustomers?: number;
    numInvoices?: number;
  };
  /**
   * Callback when onboarding is completed (either way)
   */
  onComplete?: (seedingData: SeedDataResponse | null) => void;
}

export interface UseOnboardingReturn {
  // State
  step: OnboardingStep;
  isFirstTime: boolean;
  isLoading: boolean;
  seedingData: SeedDataResponse | null;

  // Dialog states
  showInitialDialog: boolean;
  showPostSeedingDialog: boolean;

  // Actions
  startOnboarding: () => void;
  handleSeedConfirm: () => Promise<void>;
  handleSeedDecline: () => void;
  handleKeepData: () => void;
  handleDiscardData: () => Promise<void>;
  hideDialogs: () => void;
}

export function useOnboarding(options: UseOnboardingOptions = {}): UseOnboardingReturn {
  const {
    autoShow = true,
    seedOptions = {},
    onComplete,
  } = options;

  // Queries and mutations
  const seedMutation = useSeedData();
  const clearMutation = useClearData();
  const seedStatusQuery = useSeedStatus();

  // State management
  const [step, setStep] = useState<OnboardingStep>("idle");
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [seedingData, setSeedingData] = useState<SeedDataResponse | null>(null);

  // Initialize onboarding check on mount
  useEffect(() => {
    const first = isFirstTimeUser();
    setIsFirstTime(first);

    if (first && autoShow && seedStatusQuery.data) {
      if (!seedStatusQuery.data.hasData) {
        setStep("initial-dialog");
      }
    }
  }, [autoShow, seedStatusQuery.data]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const startOnboarding = () => {
    setStep("initial-dialog");
  };

  const handleSeedConfirm = async () => {
    try {
      setStep("seeding");
      const result = await seedMutation.mutateAsync(seedOptions);
      setSeedingData(result);
      setStep("post-seeding-dialog");
    } catch (error) {
      console.error("Seeding failed:", error);
      setStep("initial-dialog");
    }
  };

  const handleSeedDecline = () => {
    // User declined seeding, mark onboarding as complete
    markOnboardingCompleted();
    setStep("idle");
    setSeedingData(null);
    onComplete?.(null);
  };

  const handleKeepData = () => {
    // User kept the seeded data, mark onboarding as complete
    markOnboardingCompleted();
    setStep("idle");
    onComplete?.(seedingData);
  };

  const handleDiscardData = async () => {
    try {
      await clearMutation.mutateAsync();
      markOnboardingCompleted();
      setStep("idle");
      setSeedingData(null);
      onComplete?.(null);
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  const hideDialogs = () => {
    setStep("idle");
  };

  // ─── Computed values ────────────────────────────────────────────────────

  const isLoading = seedMutation.isPending || clearMutation.isPending;

  return {
    // State
    step,
    isFirstTime,
    isLoading,
    seedingData,

    // Dialog visibility
    showInitialDialog: step === "initial-dialog" || step === "seeding",
    showPostSeedingDialog: step === "post-seeding-dialog",

    // Actions
    startOnboarding,
    handleSeedConfirm,
    handleSeedDecline,
    handleKeepData,
    handleDiscardData,
    hideDialogs,
  };
}
