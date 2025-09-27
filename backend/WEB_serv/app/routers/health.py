"""Эндпоинты health-check для веб-сервиса."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/live", summary="Проверка жизнеспособности")
async def liveness_probe() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready", summary="Проверка готовности")
async def readiness_probe() -> dict[str, str]:
    return {"status": "ready"}
