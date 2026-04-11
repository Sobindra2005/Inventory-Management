/**
 * First-time user detection and onboarding state management
 * Uses localStorage to persist user's choice across sessions
 */

const FIRST_TIME_USER_KEY = "inventory_first_time_user";
const ONBOARDING_COMPLETED_KEY = "inventory_onboarding_completed";

/**
 * Check if user is visiting dashboard for the first time
 */
export function isFirstTimeUser(): boolean {
  if (typeof window === "undefined") return true;

  const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return !completed;
}

/**
 * Mark onboarding as completed
 */
export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ONBOARDING_COMPLETED_KEY, JSON.stringify({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  }));
}

/**
 * Reset first-time user status (for testing or user reset)
 */
export function resetFirstTimeUser(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  localStorage.removeItem(FIRST_TIME_USER_KEY);
}

/**
 * Get onboarding completion info
 */
export function getOnboardingInfo(): {
  completed: boolean;
  timestamp?: string;
  userAgent?: string;
} {
  if (typeof window === "undefined") {
    return { completed: false };
  }

  const stored = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
  if (!stored) return { completed: false };

  try {
    const parsed = JSON.parse(stored);
    return {
      completed: true,
      timestamp: parsed.timestamp,
      userAgent: parsed.userAgent,
    };
  } catch {
    return { completed: false };
  }
}
