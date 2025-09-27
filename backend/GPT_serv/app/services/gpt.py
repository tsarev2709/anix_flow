"""Обёртка над OpenAI API."""

from __future__ import annotations

from typing import Any

from openai import AsyncOpenAI
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from ..config import get_settings

settings = get_settings()

_client = AsyncOpenAI(api_key=settings.openai_api_key)


class GPTRequestError(RuntimeError):
    """Ошибка запроса к OpenAI."""


async def call_gpt(messages: list[dict[str, Any]], response_format: dict[str, Any] | None = None) -> dict[str, Any]:
    """Отправляет запрос в OpenAI Chat Completions с повторными попытками."""

    async for attempt in AsyncRetrying(
        retry=retry_if_exception_type(GPTRequestError),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    ):
        with attempt:
            response = await _client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                response_format=response_format,
                timeout=settings.openai_timeout,
            )
            if not response.choices:
                raise GPTRequestError("Empty response from OpenAI")
            return response.choices[0].message.model_dump()

    raise GPTRequestError("Failed to call OpenAI after retries")
