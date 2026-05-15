"""
FastAPI application entry point.

Wires the REST routers, CORS, WebSocket notifications, and a startup hook that
creates the database schema and seeds the database on first run.

For the local PFA demonstration, Base.metadata.create_all is acceptable.
For a real production deployment, Alembic migrations should be used instead.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.api import notifications_ws
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User  # ensure all models are imported


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)


def _validate_runtime_settings() -> None:
    """Log deployment warnings without breaking the local development stack."""

    if settings.environment.lower() in {"production", "prod"}:
        if settings.secret_key in {
            "dev-secret-change-in-production",
            "change-me-in-production-very-long-secret",
        }:
            logger.warning(
                "SECURITY WARNING: SECRET_KEY uses a development/default value."
            )

        if settings.frontend_origin.startswith("http://"):
            logger.warning(
                "SECURITY WARNING: FRONTEND_ORIGIN uses HTTP in production: %s",
                settings.frontend_origin,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_runtime_settings()

    logger.info("Creating database schema if absent...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if db.query(User).count() == 0:
            logger.info("Database empty - running initial seed...")

            from seeds.seed_demo import seed_all

            seed_all(db)
            logger.info("Initial seed complete.")
        else:
            logger.info("Database already populated - skipping seed.")
    finally:
        db.close()

    yield

    logger.info("Shutting down.")


app = FastAPI(
    title="Portail EMSI - Suivi des Absences et Notes",
    description=(
        "API du portail de suivi pédagogique avec détection IA des profils à risque. "
        "Projet PFA EMSI 2025/2026."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


allowed_origins = [
    settings.frontend_origin,
    "http://localhost:3000",
]

# Avoid duplicates while keeping order.
allowed_origins = list(dict.fromkeys(allowed_origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)
app.include_router(notifications_ws.router)


@app.get("/")
def root():
    return {
        "name": "Portail EMSI API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
        "websocket_notifications": "/ws/notifications?token=JWT",
        "environment": settings.environment,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)

    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur"},
    )