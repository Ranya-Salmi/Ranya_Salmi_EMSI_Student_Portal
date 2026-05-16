"""
Audit log — append-only record of every mutation.

The application layer never exposes update/delete endpoints for this table.
Each row can also be linked cryptographically to the previous row using:
- hash_precedent
- hash_courant

This creates a tamper-evident audit chain.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=False)

    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    action = Column(String(20), nullable=False)  # create, update, delete, verify_integrity

    ancienne_valeur = Column(JSON, nullable=True)
    nouvelle_valeur = Column(JSON, nullable=True)
    raison_modification = Column(String(500), nullable=True)

    ip_adresse = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Tamper-evident hash chain.
    hash_precedent = Column(String(64), nullable=True)
    hash_courant = Column(String(64), nullable=True, index=True)

    user = relationship("User", foreign_keys=[user_id])