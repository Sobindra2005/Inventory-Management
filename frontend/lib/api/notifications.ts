import { httpClient } from "@/lib/api/http-client";
import type { NotificationItem, NotificationListResponse } from "@/lib/contracts/notifications";

export async function fetchNotifications(limit: number = 20): Promise<NotificationListResponse> {
  const response = await httpClient.get<NotificationListResponse>("/api/v1/notifications", {
    params: { limit },
  });
  return response.data;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  const response = await httpClient.patch<NotificationItem>(`/api/v1/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const response = await httpClient.patch<{ success: boolean }>("/api/v1/notifications/read-all");
  return response.data;
}
