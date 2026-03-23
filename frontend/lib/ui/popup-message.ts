export type PopupMessageVariant = "info" | "error";

export type PopupMessagePayload = {
  message: string;
  variant?: PopupMessageVariant;
  durationMs?: number;
};

export type PopupMessage = PopupMessagePayload & {
  id: string;
};

export type PopupConfirmPayload = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type PopupConfirmRequest = PopupConfirmPayload & {
  id: string;
};

type PopupMessageListener = (payload: PopupMessage) => void;
type PopupConfirmListener = (payload: PopupConfirmRequest) => void;

const listeners = new Set<PopupMessageListener>();
const confirmListeners = new Set<PopupConfirmListener>();
const confirmResolvers = new Map<string, (confirmed: boolean) => void>();

const createPopupId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `popup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function subscribePopupMessages(listener: PopupMessageListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function showPopupMessage(payload: PopupMessagePayload) {
  if (typeof window === "undefined") {
    return;
  }

  const popupMessage: PopupMessage = {
    id: createPopupId(),
    variant: payload.variant ?? "info",
    durationMs: payload.durationMs ?? 3500,
    message: payload.message,
  };

  listeners.forEach((listener) => {
    listener(popupMessage);
  });
}

export function subscribePopupConfirms(listener: PopupConfirmListener) {
  confirmListeners.add(listener);

  return () => {
    confirmListeners.delete(listener);
  };
}

export function requestPopupConfirm(payload: PopupConfirmPayload): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  const id = createPopupId();
  const request: PopupConfirmRequest = {
    id,
    title: payload.title,
    message: payload.message,
    confirmLabel: payload.confirmLabel ?? "Confirm",
    cancelLabel: payload.cancelLabel ?? "Cancel",
  };

  const promise = new Promise<boolean>((resolve) => {
    confirmResolvers.set(id, resolve);
  });

  confirmListeners.forEach((listener) => {
    listener(request);
  });

  return promise;
}

export function resolvePopupConfirm(id: string, confirmed: boolean) {
  const resolver = confirmResolvers.get(id);
  if (!resolver) {
    return;
  }

  confirmResolvers.delete(id);
  resolver(confirmed);
}