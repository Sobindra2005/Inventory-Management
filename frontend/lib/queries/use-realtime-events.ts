"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import { notificationsQueryKeys } from "@/lib/queries/use-notifications-query";
import { dashboardQueryKeys } from "@/lib/queries/use-dashboard-query";
import type { NotificationItem, NotificationListResponse } from "@/lib/contracts/notifications";
import type { GeneratedReport } from "@/lib/contracts/dashboard";

type RealtimeEvent = {
  type?: string;
  userId?: string;
  data?: {
    id?: string;
    type?: string;
    message?: string;
    isRead?: boolean;
    reportId?: string;
    fileUrl?: string;
    fileSize?: number;
    status?: "queued" | "processing" | "completed" | "failed";
    [key: string]: unknown;
  };
};

const HEARTBEAT_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 3_000;

const buildWebSocketUrl = (token: string): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/api/v1/ws/notifications";
    url.search = new URLSearchParams({ token }).toString();
    return url.toString();
  } catch {
    const wsBaseUrl = apiBaseUrl.replace(/^http/i, "ws").replace(/\/$/, "");
    return `${wsBaseUrl}/api/v1/ws/notifications?token=${encodeURIComponent(token)}`;
  }
};

const updateReportsCache = (
  previousReports: GeneratedReport[] | undefined,
  eventData: RealtimeEvent["data"]
): GeneratedReport[] | undefined => {
  const nextStatus = eventData?.status;

  if (!previousReports || !eventData?.reportId || !nextStatus) {
    return previousReports;
  }

  let found = false;
  const next = previousReports.map((report) => {
    if (report.id !== eventData.reportId) {
      return report;
    }

    found = true;
    return {
      ...report,
      status: nextStatus,
      fileUrl: eventData.fileUrl ?? report.fileUrl,
      fileSize: eventData.fileSize ?? report.fileSize,
      updatedAt: new Date().toISOString(),
    };
  });

  return found ? next : previousReports;
};

const updateNotificationsCache = (
  previousNotifications: NotificationListResponse | undefined,
  eventData: RealtimeEvent["data"]
): NotificationListResponse | undefined => {
  if (!previousNotifications || !eventData?.id || !eventData.message || !eventData.type) {
    return previousNotifications;
  }

  const alreadyExists = previousNotifications.notifications.some(
    (notification) => notification.id === eventData.id
  );

  if (alreadyExists) {
    return previousNotifications;
  }

  const incomingNotification: NotificationItem = {
    id: eventData.id,
    userId: "",
    type: eventData.type,
    message: eventData.message,
    isRead: eventData.isRead ?? false,
    reportId: eventData.reportId,
    createdAt: typeof eventData.createdAt === "string" ? eventData.createdAt : new Date().toISOString(),
  };

  return {
    notifications: [incomingNotification, ...previousNotifications.notifications],
    unreadCount: incomingNotification.isRead
      ? previousNotifications.unreadCount
      : previousNotifications.unreadCount + 1,
  };
};

export function useRealtimeEvents() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let heartbeatTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let cancelled = false;

    const cleanupSocket = () => {
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      if (socket) {
        socket.close();
        socket = null;
      }
    };

    const connect = async () => {
      const token = await getToken();
      if (!token || cancelled) {
        return;
      }

      cleanupSocket();

      const wsUrl = buildWebSocketUrl(token);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        heartbeatTimer = window.setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        let payload: RealtimeEvent | null = null;
        try {
          payload = JSON.parse(event.data) as RealtimeEvent;
        } catch {
          payload = null;
        }

        const eventType = payload?.type;
        const eventData = payload?.data;

        if (eventType === "notification") {
          queryClient.setQueryData<NotificationListResponse>(
            notificationsQueryKeys.all,
            (previousNotifications) => updateNotificationsCache(previousNotifications, eventData)
          );
          queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
        }

        if (eventType === "report_status") {
          queryClient.setQueryData<GeneratedReport[]>(
            dashboardQueryKeys.reports(),
            (previousReports) => updateReportsCache(previousReports, eventData)
          );
          queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.reports() });
          queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }

        if (heartbeatTimer !== null) {
          window.clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        reconnectTimer = window.setTimeout(() => {
          void connect();
        }, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      cleanupSocket();
    };
  }, [getToken, queryClient]);
}
