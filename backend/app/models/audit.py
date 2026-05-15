"""
Audit log — append-only record of every mutation (notes, absences, users).
The application layer never issues UPDATE or DELETE on this table.
F04 of the cahier des charges.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=False)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    action = Column(String(20), nullable=False)  # create, update, delete

    ancienne_valeur = Column(JSON, nullable=True)
    nouvelle_valeur = Column(JSON, nullable=True)
    raison_modification = Column(String(500), nullable=True)

    ip_adresse = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
