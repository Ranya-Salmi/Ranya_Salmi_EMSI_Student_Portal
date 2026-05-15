"""
FastAPI application entry point.

Wires the routers, CORS, WebSocket notifications, and a startup hook that
creates the database schema and seeds the database on first run.

For the PFA demo, Base.metadata.create_all is acceptable.
For a real production deployment, Alembic migrations should be used instead.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist.
    logger.info("Creating database schema (if absent)...")
    Base.metadata.create_all(bind=engine)

    # Seed if empty.
    db = SessionLocal()

    try:
        if db.query(User).count() == 0:
            logger.info("Database empty - running seed...")

            from seeds.seed_demo import seed_all

            seed_all(db)
            logger.info("Seed complete.")
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


# CORS for the Next.js frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST API routes.
app.include_router(api_router)

# WebSocket real-time notifications.
# Endpoint: ws://localhost:8001/ws/notifications?token=JWT
app.include_router(notifications_ws.router)


@app.get("/")
def root():
    return {
        "name": "Portail EMSI API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "websocket_notifications": "/ws/notifications?token=JWT",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):  # pragma: no cover
    logger.exception("Unhandled exception: %s", exc)

    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur"},
    )