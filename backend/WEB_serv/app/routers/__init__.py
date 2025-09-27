"""Маршруты FastAPI-приложения."""

from fastapi import APIRouter

from . import health, projects

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
