import csv
import io
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from pymongo import MongoClient
from pymongo.collection import Collection
from redis import Redis

from app.core.celery_app import celery_app
from app.core.config import settings
from app.services.openrouter_service import generate_structured_report_rows

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_date_start(value: str) -> datetime:
    parsed = datetime.strptime(value, "%Y-%m-%d")
    return parsed.replace(tzinfo=timezone.utc)


def _parse_date_end(value: str) -> datetime:
    parsed = datetime.strptime(value, "%Y-%m-%d")
    return parsed.replace(tzinfo=timezone.utc, hour=23, minute=59, second=59, microsecond=999999)


def _serialize_bson(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, dict):
        return {key: _serialize_bson(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize_bson(item) for item in value]
    return value


def _build_csv_from_rows(headers: list[str], rows: list[dict[str, Any]]) -> str:
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow({header: row.get(header, "") for header in headers})
    return stream.getvalue()


def _fallback_rows(report_type: str, normalized_data: dict[str, Any]) -> tuple[list[str], list[dict[str, Any]]]:
    if report_type == "sales":
        rows = normalized_data.get("sales", [])
    elif report_type == "inventory":
        rows = normalized_data.get("inventory", [])
    elif report_type == "customer":
        rows = normalized_data.get("customers", [])
    else:
        rows = normalized_data.get("summary_rows", [])

    if not rows:
        return ["message"], [{"message": "No data for selected range"}]

    first = rows[0]
    if isinstance(first, dict):
        headers = list(first.keys())
        normalized_rows = [{header: row.get(header, "") for header in headers} for row in rows if isinstance(row, dict)]
        return headers, normalized_rows

    return ["value"], [{"value": str(item)} for item in rows]


def _publish_ws_event(redis_client: Redis, user_id: str, event_type: str, data: dict) -> None:
    payload = {
        "type": event_type,
        "userId": user_id,
        "data": data,
    }
    redis_client.publish(settings.WS_EVENTS_CHANNEL, json.dumps(payload, default=str))


def _insert_notification(
    notifications_col: Collection,
    redis_client: Redis,
    user_id: str,
    notification_type: str,
    message: str,
    report_id: ObjectId | None = None,
) -> None:
    now = _utc_now()
    notification_doc = {
        "userId": user_id,
        "type": notification_type,
        "message": message,
        "isRead": False,
        "reportId": report_id,
        "createdAt": now,
    }
    inserted = notifications_col.insert_one(notification_doc)

    _publish_ws_event(
        redis_client,
        user_id,
        "notification",
        {
            "id": str(inserted.inserted_id),
            "type": notification_type,
            "message": message,
            "isRead": False,
            "reportId": str(report_id) if report_id else None,
            "createdAt": now.isoformat().replace("+00:00", "Z"),
        },
    )


def _fetch_report_data(database, report_type: str, user_id: str, start_dt: datetime, end_dt: datetime) -> dict[str, Any]:
    sales_col = database["sales_invoices"]
    inventory_col = database["inventory_items"]
    customers_col = database["customers"]
    credit_col = database["credit_ledger"]

    if report_type == "sales":
        sales_docs = list(
            sales_col.find(
                {"userId": user_id, "dateTime": {"$gte": start_dt, "$lte": end_dt}},
                {"_id": 0},
            )
        )
        return {"sales": _serialize_bson(sales_docs)}

    if report_type == "inventory":
        inventory_docs = list(
            inventory_col.find(
                {"userId": user_id, "updatedAt": {"$gte": start_dt, "$lte": end_dt}},
                {"_id": 0},
            )
        )
        return {"inventory": _serialize_bson(inventory_docs)}

    if report_type == "customer":
        customer_docs = list(customers_col.find({"userId": user_id}, {"_id": 0}))
        credit_docs = list(credit_col.find({"userId": user_id}, {"_id": 0}))
        return {
            "customers": _serialize_bson(customer_docs),
            "credit_ledger": _serialize_bson(credit_docs),
        }

    # daily_summary
    sales_docs = list(
        sales_col.find(
            {"userId": user_id, "dateTime": {"$gte": start_dt, "$lte": end_dt}},
            {"_id": 0, "total": 1, "paymentMethod": 1, "itemCount": 1, "dateTime": 1},
        )
    )
    low_stock_count = inventory_col.count_documents(
        {"userId": user_id, "$expr": {"$lte": ["$stock", "$lowStockThreshold"]}}
    )

    total_sales = sum(item.get("total", 0) for item in sales_docs)
    total_transactions = len(sales_docs)
    total_items = sum(item.get("itemCount", 0) for item in sales_docs)

    summary_rows = [
        {
            "metric": "total_sales",
            "value": total_sales,
        },
        {
            "metric": "total_transactions",
            "value": total_transactions,
        },
        {
            "metric": "total_items_sold",
            "value": total_items,
        },
        {
            "metric": "low_stock_count",
            "value": low_stock_count,
        },
    ]
    return {"summary_rows": _serialize_bson(summary_rows), "sales": _serialize_bson(sales_docs)}


@celery_app.task(bind=True, name="app.workers.report_tasks.generate_report_task", max_retries=3, default_retry_delay=10)
def generate_report_task(
    self,
    report_id: str,
    user_id: str,
    report_type: str,
    start_date: str,
    end_date: str,
):
    mongo_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    redis_client = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, decode_responses=True)

    try:
        database = mongo_client.get_default_database()
        reports_col = database["reports"]
        notifications_col = database["notifications"]

        object_id = ObjectId(report_id)
        existing_report = reports_col.find_one({"_id": object_id, "userId": user_id})
        if existing_report is None:
            logger.warning("Report not found for processing report_id=%s user_id=%s", report_id, user_id)
            return

        if existing_report.get("status") == "completed" and existing_report.get("filePath"):
            _publish_ws_event(
                redis_client,
                user_id,
                "report_status",
                {"reportId": report_id, "status": "completed", "fileUrl": existing_report.get("fileUrl")},
            )
            return

        now = _utc_now()
        reports_col.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "processing",
                    "updatedAt": now,
                    "startedAt": now,
                }
            },
        )

        _publish_ws_event(
            redis_client,
            user_id,
            "report_status",
            {"reportId": report_id, "status": "processing"},
        )

        start_dt = _parse_date_start(start_date)
        end_dt = _parse_date_end(end_date)
        normalized_data = _fetch_report_data(database, report_type, user_id, start_dt, end_dt)

        try:
            headers, rows = generate_structured_report_rows(
                report_type=report_type,
                start_date=start_date,
                end_date=end_date,
                normalized_data=normalized_data,
            )
        except Exception as ai_error:
            logger.warning("OpenRouter failed, using deterministic fallback: %s", ai_error)
            headers, rows = _fallback_rows(report_type, normalized_data)

        csv_content = _build_csv_from_rows(headers, rows)

        output_dir = Path(settings.REPORT_STORAGE_DIR) / user_id
        output_dir.mkdir(parents=True, exist_ok=True)

        file_name = f"report_{report_type}_{start_date}_{end_date}_{report_id}.csv"
        file_path = output_dir / file_name
        file_path.write_text(csv_content, encoding="utf-8")
        file_size = file_path.stat().st_size

        completed_at = _utc_now()
        file_url = f"/api/v1/dashboard/reports/{report_id}/download"

        reports_col.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "completed",
                    "generatedAt": completed_at,
                    "updatedAt": completed_at,
                    "filePath": str(file_path),
                    "fileKey": f"{user_id}/{file_name}",
                    "fileUrl": file_url,
                    "fileSize": file_size,
                }
            },
        )

        message = f"{report_type.title()} report is ready for download."
        _insert_notification(
            notifications_col=notifications_col,
            redis_client=redis_client,
            user_id=user_id,
            notification_type="report_ready",
            message=message,
            report_id=object_id,
        )

        _publish_ws_event(
            redis_client,
            user_id,
            "report_status",
            {
                "reportId": report_id,
                "status": "completed",
                "fileUrl": file_url,
                "fileSize": file_size,
            },
        )

        logger.info("Report generated successfully report_id=%s user_id=%s", report_id, user_id)
    except Exception as error:
        logger.exception("Report generation failed report_id=%s user_id=%s", report_id, user_id)

        try:
            database = mongo_client.get_default_database()
            reports_col = database["reports"]
            notifications_col = database["notifications"]
            failed_at = _utc_now()
            reports_col.update_one(
                {"_id": ObjectId(report_id)},
                {
                    "$set": {
                        "status": "failed",
                        "updatedAt": failed_at,
                        "errorMessage": str(error),
                    }
                },
            )

            _insert_notification(
                notifications_col=notifications_col,
                redis_client=redis_client,
                user_id=user_id,
                notification_type="error",
                message=f"Failed to generate {report_type} report.",
                report_id=ObjectId(report_id),
            )

            _publish_ws_event(
                redis_client,
                user_id,
                "report_status",
                {"reportId": report_id, "status": "failed", "message": str(error)},
            )
        except Exception:
            logger.exception("Failed to persist report error state report_id=%s", report_id)

        raise
    finally:
        mongo_client.close()
        redis_client.close()
