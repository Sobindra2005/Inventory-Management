import { showPopupMessage } from "@/lib/ui/popup-message";

const shownFallbackSources = new Set<string>();

export function showDemoFallbackNotice(source: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSource = source.trim().toLowerCase();
  if (shownFallbackSources.has(normalizedSource)) {
    return;
  }

  shownFallbackSources.add(normalizedSource);

}