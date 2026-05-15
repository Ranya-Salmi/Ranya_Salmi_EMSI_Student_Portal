"""
Application configuration loaded from environment variables.
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
