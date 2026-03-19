from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import get_mongo_db
from app.schemas.notifications import NotificationItem, NotificationListResponse

router = APIRouter(prefix="/notifications")


def _to_iso(value: datetime | str | None) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return value.isoformat().replace("+00:00", "Z")


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


def _to_notification_item(document: dict) -> NotificationItem:
    return NotificationItem(
        id=str(document["_id"]),
        userId=document["userId"],
        type=document["type"],
        message=document["message"],
        isRead=document.get("isRead", False),
        reportId=str(document["reportId"]) if document.get("reportId") else None,
        createdAt=_to_iso(document.get("createdAt")),
    )


@router.get("", response_model=NotificationListResponse)
async def list_notifications(request: Request, limit: int = 20):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    notifications_col = database["notifications"]

    documents = await notifications_col.find({"userId": user_id}).sort("createdAt", -1).limit(limit).to_list(length=None)
    unread_count = await notifications_col.count_documents({"userId": user_id, "isRead": False})

    return NotificationListResponse(
        notifications=[_to_notification_item(document) for document in documents],
        unreadCount=unread_count,
    )


@router.patch("/{notification_id}/read", response_model=NotificationItem)
async def mark_notification_read(notification_id: str, request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    notifications_col = database["notifications"]

    try:
        object_id = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    await notifications_col.update_one(
        {"_id": object_id, "userId": user_id},
        {"$set": {"isRead": True}},
    )

    document = await notifications_col.find_one({"_id": object_id, "userId": user_id})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    return _to_notification_item(document)


@router.patch("/read-all")
async def mark_all_notifications_read(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    notifications_col = database["notifications"]

    await notifications_col.update_many(
        {"userId": user_id, "isRead": False},
        {"$set": {"isRead": True}},
    )

    return {"success": True}
