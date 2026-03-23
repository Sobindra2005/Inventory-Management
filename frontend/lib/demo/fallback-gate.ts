import { getHealth } from "@/lib/api/health";
import { requestPopupConfirm } from "@/lib/ui/popup-message";

let healthStatusPromise: Promise<boolean> | null = null;
let demoFallbackPermissionPromise: Promise<boolean> | null = null;

async function isBackendHealthy(): Promise<boolean> {
  if (!healthStatusPromise) {
    healthStatusPromise = getHealth()
      .then(() => true)
      .catch(() => false);
  }

  return healthStatusPromise;
}

export async function canProceedWithDemoFallback(): Promise<boolean> {
  const healthy = await isBackendHealthy();
  if (healthy) {
    return false;
  }

  if (!demoFallbackPermissionPromise) {
    demoFallbackPermissionPromise = requestPopupConfirm({
      title: "Backend Unavailable",
      message:
        "Server health check failed. Do you want to continue using sample data for now?",
      confirmLabel: "Use Sample Data",
      cancelLabel: "Cancel",
    });
  }

  return demoFallbackPermissionPromise;
}