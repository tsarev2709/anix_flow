"""Pydantic-схемы GPT-прокси."""

from typing import Annotated
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ScriptRequest(BaseModel):
    prompt: Annotated[str, Field(min_length=10, max_length=4000)]
    narrator: Annotated[str, Field(min_length=3, max_length=120)]
    scenes_count: Annotated[int, Field(ge=1, le=20)] = 5


class Scene(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    content: str
    duration: float = Field(ge=0)


class ScriptResponse(BaseModel):
    title: str
    narrator: str
    scenes: list[Scene]
