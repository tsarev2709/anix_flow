"""Точка входа веб-приложения Anix Flow."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import redis_client, shutdown
from .routers import api_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict[str, str]:
        await redis_client.ping()
        return {"status": "ok"}

    app.include_router(api_router, prefix="/api")

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        await shutdown()

    return app


app = create_app()
