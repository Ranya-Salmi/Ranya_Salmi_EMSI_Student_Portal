"""Audit log — read-only API.

Production rule:
- Admin can read the full audit journal.
- No update/delete endpoint is exposed here.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import AuditLog, User
from app.schemas.audit import AuditLogRead


router = APIRouter()


@router.get("/logs", response_model=List[AuditLogRead])
def get_logs(
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    user_id: Optional[int] = None,
    limit: int = Query(100, le=500),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)

    if table_name:
        q = q.filter(AuditLog.table_name == table_name)

    if record_id:
        q = q.filter(AuditLog.record_id == record_id)

    if user_id:
        q = q.filter(AuditLog.user_id == user_id)

    return q.order_by(AuditLog.timestamp.desc()).limit(limit).all()