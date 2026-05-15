"""
SQLAlchemy database engine, session factory, and Base declarative class.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator

from app.config import settings


def _engine_kwargs(url: str) -> dict:
    """Return engine kwargs appropriate for the DB backend."""
    if url.startswith("sqlite"):
        # SingletonThreadPool used by SQLite doesn't accept pool_size/max_overflow
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}


engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
