"""Absence model — student missed a session of a module."""
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Absence(Base):
    __tablename__ = "absences"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False, index=True)
    date_cours = Column(Date, nullable=False)
    duree_heures = Column(Integer, default=2, nullable=False)

    justifiee = Column(Boolean, default=False, nullable=False)
    motif_justification = Column(String(500), nullable=True)
    statut = Column(String(30), default="non_justifiee", nullable=False)

    saisie_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    etudiant = relationship("User", foreign_keys=[etudiant_id], back_populates="absences")
    module = relationship("Module", back_populates="absences")
    saisisseur = relationship("User", foreign_keys=[saisie_par])
