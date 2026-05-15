"""Note model — grade for a student on an evaluation."""
from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Note(Base):
    __tablename__ = "notes"
    __table_args__ = (UniqueConstraint("etudiant_id", "evaluation_id", name="uq_note_etudiant_eval"),)

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False, index=True)
    valeur = Column(Float, nullable=True)  # null = not graded yet
    statut = Column(String(30), default="validee", nullable=False)  # validee, brouillon, contestee

    saisie_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    etudiant = relationship("User", foreign_keys=[etudiant_id], back_populates="notes")
    evaluation = relationship("Evaluation", back_populates="notes")
    saisisseur = relationship("User", foreign_keys=[saisie_par])
