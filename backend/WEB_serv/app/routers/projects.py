"""Черновые эндпоинты для работы с проектами."""

from fastapi import APIRouter, Depends, HTTPException, status

from .. import schemas
from ..db import get_db

router = APIRouter()


@router.get("/", response_model=list[schemas.Project], summary="Список проектов (заглушка)")
async def list_projects(db=Depends(get_db)) -> list[schemas.Project]:  # type: ignore[override]
    # TODO: заменить на реальное обращение к БД
    return []


@router.post("/", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
async def create_project(payload: schemas.ProjectCreate, db=Depends(get_db)) -> schemas.Project:  # type: ignore[override]
    # TODO: реализовать сохранение в БД
    project = schemas.Project(name=payload.name, description=payload.description)
    return project


@router.get("/{project_id}", response_model=schemas.Project)
async def get_project(project_id: str, db=Depends(get_db)) -> schemas.Project:  # type: ignore[override]
    # TODO: извлекать проект из БД
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
