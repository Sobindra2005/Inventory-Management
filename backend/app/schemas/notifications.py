from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    id: str
    userId: str
    type: str
    message: str
    isRead: bool
    reportId: str | None = None
    createdAt: str


class NotificationListResponse(BaseModel):
    notifications: list[NotificationItem]
    unreadCount: int = Field(ge=0)
