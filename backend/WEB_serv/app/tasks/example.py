"""Example Celery tasks for health checks and testing."""

from app.celery_app import celery_app


@celery_app.task(name="app.tasks.ping")
def ping() -> str:
    """Return a static response to confirm the worker is alive."""

    return "pong"
