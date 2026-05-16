"""
Application configuration loaded from environment variables.

Local development can use safe defaults.
Production must provide secure environment variables, especially SECRET_KEY.
"""
from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql://emsi_user:emsi_pass@localhost:5432/emsi_portail"

    # Security
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 480
    algorithm: str = "HS256"

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "portail@emsi.ma"

    # Risk thresholds
    seuil_absence_alerte: float = 30.0
    seuil_note_alerte: float = 10.0

    # Environment
    environment: str = "development"

    @field_validator("environment")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.lower().strip()

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        weak_values = {
            "dev-secret-change-in-production",
            "change-me-in-production-very-long-secret",
            "secret",
            "changeme",
        }

        if not value or len(value) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 characters.")

        if value in weak_values:
            # Allowed in local development, blocked by runtime validation in main.py
            return value

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()