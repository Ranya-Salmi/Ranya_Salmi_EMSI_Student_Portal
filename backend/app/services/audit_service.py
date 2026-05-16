"""
Audit log service — single entry point for writing audit records.

Design:
- Reads are exposed only via the audit API.
- No service method issues UPDATE or DELETE against audit_logs.
- Each new entry is appended with a tamper-evident chained hash:
    hash_courant = SHA256(hash_precedent + canonical entry payload)
"""
from __future__ import annotations

from datetime import datetime
import hashlib
import json
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def _serialize(value: Any) -> Any:
    """Best-effort JSON-friendly serialization for old/new value dicts."""

    if value is None:
        return None

    if isinstance(value, dict):
        return {str(key): _serialize(val) for key, val in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [_serialize(item) for item in value]

    if hasattr(value, "isoformat"):
        return value.isoformat()

    if isinstance(value, (int, float, str, bool)):
        return value

    return str(value)


def _canonical_json(value: Any) -> str:
    """Stable JSON representation used for audit hashing."""

    return json.dumps(
        _serialize(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )


def _get_previous_hash(db: Session) -> Optional[str]:
    """Return the last known audit hash, if any."""

    previous = (
        db.query(AuditLog)
        .filter(AuditLog.hash_courant.isnot(None))
        .order_by(AuditLog.id.desc())
        .first()
    )

    return previous.hash_courant if previous else None


def _compute_audit_hash(
    *,
    hash_precedent: Optional[str],
    user_id: Optional[int],
    user_email: str,
    table_name: str,
    record_id: int,
    action: str,
    ancienne_valeur: Any,
    nouvelle_valeur: Any,
    raison_modification: Optional[str],
    ip_adresse: Optional[str],
    user_agent: Optional[str],
    timestamp: datetime,
) -> str:
    """Compute SHA-256 for one audit entry."""

    payload = {
        "hash_precedent": hash_precedent,
        "user_id": user_id,
        "user_email": user_email,
        "table_name": table_name,
        "record_id": record_id,
        "action": action,
        "ancienne_valeur": ancienne_valeur,
        "nouvelle_valeur": nouvelle_valeur,
        "raison_modification": raison_modification,
        "ip_adresse": ip_adresse,
        "user_agent": user_agent,
        "timestamp": timestamp.isoformat(),
    }

    return hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()


def log_action(
    db: Session,
    *,
    user: Optional[User],
    table_name: str,
    record_id: int,
    action: str,  # create | update | delete | verify_integrity
    ancienne_valeur: Optional[dict] = None,
    nouvelle_valeur: Optional[dict] = None,
    raison_modification: Optional[str] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    """
    Append a single audit row.

    The caller commits this entry in the same transaction as the audited action.
    This function only INSERTs; it does not update or delete audit rows.
    """

    serialized_old = _serialize(ancienne_valeur)
    serialized_new = _serialize(nouvelle_valeur)

    ip_adresse = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None

    user_id = user.id if user else None
    user_email = user.email if user else "system"

    timestamp = datetime.utcnow()
    hash_precedent = _get_previous_hash(db)

    hash_courant = _compute_audit_hash(
        hash_precedent=hash_precedent,
        user_id=user_id,
        user_email=user_email,
        table_name=table_name,
        record_id=record_id,
        action=action,
        ancienne_valeur=serialized_old,
        nouvelle_valeur=serialized_new,
        raison_modification=raison_modification,
        ip_adresse=ip_adresse,
        user_agent=user_agent,
        timestamp=timestamp,
    )

    entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        table_name=table_name,
        record_id=record_id,
        action=action,
        ancienne_valeur=serialized_old,
        nouvelle_valeur=serialized_new,
        raison_modification=raison_modification,
        ip_adresse=ip_adresse,
        user_agent=user_agent,
        timestamp=timestamp,
        hash_precedent=hash_precedent,
        hash_courant=hash_courant,
    )

    db.add(entry)
    db.flush()

    return entry