"""Настройки GPT-прокси."""

from functools import lru_cache

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = Field(default="anix-flow-gpt-proxy", validation_alias="APP_NAME")
    app_host: str = Field(default="0.0.0.0", validation_alias="APP_HOST")
    app_port: int = Field(default=9000, validation_alias="APP_PORT")

    openai_api_key: str = Field(..., validation_alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4.1-mini", validation_alias="OPENAI_MODEL")
    openai_timeout: float = Field(default=45, validation_alias="OPENAI_TIMEOUT")

    redis_url: AnyUrl = Field(..., validation_alias="REDIS_URL")
    cache_ttl_seconds: int = Field(default=600, validation_alias="CACHE_TTL_SECONDS")

    auth_shared_secret: str = Field(..., validation_alias="AUTH_SHARED_SECRET")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
