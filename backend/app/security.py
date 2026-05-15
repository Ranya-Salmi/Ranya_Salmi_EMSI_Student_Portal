"""
Password hashing (bcrypt) and JWT token generation / verification.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
from jose import JWTError, jwt

from app.config import settings


def _truncate(password: str) -> bytes:
    """bcrypt only considers the first 72 bytes; truncate to stay portable."""
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_truncate(password), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(plain_password), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str | int, role: str, extra: dict | None = None) -> str:
    """
    Create a signed JWT containing the user id (sub), role, and an expiration.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
