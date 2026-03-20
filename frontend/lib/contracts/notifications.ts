export type NotificationType = "report_ready" | "error" | "info";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType | string;
  message: string;
  isRead: boolean;
  reportId?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
