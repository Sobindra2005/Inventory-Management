from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "inventory_management",
    broker=settings.CELERY_BROKER_URL or settings.RABBITMQ_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_default_queue=settings.CELERY_REPORT_QUEUE,
    task_routes={
        "app.workers.report_tasks.generate_report_task": {
            "queue": settings.CELERY_REPORT_QUEUE,
        }
    },
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

celery_app.autodiscover_tasks(["app.workers"])
