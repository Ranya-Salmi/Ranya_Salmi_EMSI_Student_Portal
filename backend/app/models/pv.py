"""PV de deliberation and Bulletin (transcript) models."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PV(Base):
    """Proces-verbal de deliberation for a promotion at a given semester."""
    __tablename__ = "pvs"

    id = Column(Integer, primary_key=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    statut = Column(String(30), default="brouillon", nullable=False)  # brouillon, valide
    hash_controle = Column(String(64), nullable=True)  # SHA-256 of contents at validation
    signature_numerique = Column(String(64), nullable=True)
    chemin_fichier = Column(String(500), nullable=True)

    cree_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    valide_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_validation = Column(DateTime(timezone=True), nullable=True)

    promotion = relationship("Promotion")


class Bulletin(Base):
    """Individual student transcript for a semester."""
    __tablename__ = "bulletins"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    moyenne_generale = Column(Float, nullable=True)
    decision = Column(String(50), nullable=True)  # admis, ajourne, rattrapage
    chemin_fichier = Column(String(500), nullable=True)

    cree_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())

    etudiant = relationship("User", foreign_keys=[etudiant_id])
