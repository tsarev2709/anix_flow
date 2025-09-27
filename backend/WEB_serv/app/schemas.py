"""Pydantic-схемы для API веб-сервиса."""

from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class Project(ProjectCreate):
    id: UUID = Field(default_factory=uuid4)
    status: Literal["draft", "in_progress", "completed", "failed"] = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Scene(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    content: str
    duration: float = Field(ge=0)


class ScriptResponse(BaseModel):
    title: str
    narrator: str
    scenes: list[Scene]
