"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  resolvePopupConfirm,
  subscribePopupConfirms,
  subscribePopupMessages,
  type PopupConfirmRequest,
  type PopupMessage,
} from "@/lib/ui/popup-message";

const getPopupStyles = (variant: PopupMessage["variant"]) => {
  if (variant === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-border bg-card text-card-foreground";
};

export function PopupMessageCenter() {
  const [messages, setMessages] = useState<PopupMessage[]>([]);
  const [confirmRequests, setConfirmRequests] = useState<PopupConfirmRequest[]>([]);

  useEffect(() => {
    const timeouts = new Set<number>();

    const unsubscribe = subscribePopupMessages((message) => {
      setMessages((previous) => [...previous, message]);

      const timeout = window.setTimeout(() => {
        setMessages((previous) =>
          previous.filter((item) => item.id !== message.id)
        );
        timeouts.delete(timeout);
      }, message.durationMs);

      timeouts.add(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.clear();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePopupConfirms((request) => {
      setConfirmRequests((previous) => [...previous, request]);
    });

    return unsubscribe;
  }, []);

  const dismissMessage = (id: string) => {
    setMessages((previous) => previous.filter((item) => item.id !== id));
  };

  const activeConfirm = confirmRequests[0] ?? null;

  const handleConfirm = (confirmed: boolean) => {
    if (!activeConfirm) {
      return;
    }

    resolvePopupConfirm(activeConfirm.id, confirmed);
    setConfirmRequests((previous) => previous.filter((item) => item.id !== activeConfirm.id));
  };

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-2 shadow-sm ${getPopupStyles(
              message.variant
            )}`}
            role="status"
            aria-live="polite"
          >
            <p className="flex-1 text-sm">{message.message}</p>
            <button
              type="button"
              onClick={() => dismissMessage(message.id)}
              className="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss popup message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {activeConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
            <h3 className="text-base font-semibold">
              {activeConfirm.title ?? "Confirmation"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{activeConfirm.message}</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
              >
                {activeConfirm.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
              >
                {activeConfirm.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}