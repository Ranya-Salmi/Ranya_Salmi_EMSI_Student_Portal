"""
Audit log service — single entry point for writing audit records.
By design, this module exposes only a write helper; reads are done via the API,
and no method ever issues UPDATE or DELETE against audit_logs.
"""
from typing import Any, Optional
from sqlalchemy.orm import Session
from fastapi import Request

from app.models.audit import AuditLog
from app.models.user import User


def _serialize(value: Any) -> Any:
    """Best-effort JSON-friendly serialization for old/new value dicts."""
    if value is None:
        return None
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, (int, float, str, bool)):
        return value
    return str(value)


def log_action(
    db: Session,
    *,
    user: Optional[User],
    table_name: str,
    record_id: int,
    action: str,  # create | update | delete
    ancienne_valeur: Optional[dict] = None,
    nouvelle_valeur: Optional[dict] = None,
    raison_modification: Optional[str] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    """
    Append a single audit row. Does not commit — caller is expected to commit
    in the same transaction as the action being audited.
    """
    entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else "system",
        table_name=table_name,
        record_id=record_id,
        action=action,
        ancienne_valeur=_serialize(ancienne_valeur),
        nouvelle_valeur=_serialize(nouvelle_valeur),
        raison_modification=raison_modification,
        ip_adresse=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(entry)
    db.flush()
    return entry
