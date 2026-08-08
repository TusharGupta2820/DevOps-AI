from celery import Celery
from app.config.settings import settings

celery_app = Celery(
    "devops_copilot_workers",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
)


@celery_app.task(name="app.workers.tasks.ping_health_task")
def ping_health_task() -> str:
    """Sample background task verifying Celery execution pipeline."""
    return "celery_worker_alive"
