"""Конфигурация веб-сервиса Anix Flow."""

from functools import lru_cache
from typing import Optional

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения, подгружаемые из переменных окружения."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = Field(default="anix-flow-web", validation_alias="APP_NAME")
    app_env: str = Field(default="development", validation_alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", validation_alias="APP_HOST")
    app_port: int = Field(default=8000, validation_alias="APP_PORT")

    postgres_dsn: AnyUrl = Field(..., validation_alias="POSTGRES_DSN")
    redis_url: AnyUrl = Field(..., validation_alias="REDIS_URL")

    s3_endpoint: AnyUrl = Field(..., validation_alias="S3_ENDPOINT")
    s3_access_key: str = Field(..., validation_alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(..., validation_alias="S3_SECRET_KEY")
    s3_bucket: str = Field(..., validation_alias="S3_BUCKET")

    gpt_api_base_url: AnyUrl = Field(..., validation_alias="GPT_API_BASE_URL")
    gpt_api_key: str = Field(..., validation_alias="GPT_API_KEY")

    cors_origins: list[str] = Field(default_factory=lambda: ["*"])  # TODO: ограничить продакшен-ориджины
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")


@lru_cache
def get_settings() -> Settings:
    """Возвращает singleton с настройками."""

    return Settings()  # type: ignore[arg-type]
