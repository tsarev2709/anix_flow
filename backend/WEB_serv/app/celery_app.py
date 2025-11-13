"""Celery application configuration for Anix Flow."""

from celery import Celery

from app.config import get_settings


settings = get_settings()


celery_app = Celery(
    "anix_flow",
    broker=str(settings.redis_url),
    backend=str(settings.redis_url),
    include=["app.tasks"],
)


__all__ = ["celery_app"]
