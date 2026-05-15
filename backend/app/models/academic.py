"""
Academic structure: Filiere -> Promotion -> Module -> Evaluation.
Inscription links students to modules.
"""
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Filiere(Base):
    __tablename__ = "filieres"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(500), nullable=True)

    promotions = relationship("Promotion", back_populates="filiere", cascade="all, delete-orphan")


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)  # e.g., "3IIR-G2"
    annee = Column(String(20), nullable=False)  # e.g., "2025/2026"
    filiere_id = Column(Integer, ForeignKey("filieres.id"), nullable=False)

    filiere = relationship("Filiere", back_populates="promotions")
    etudiants = relationship("User", foreign_keys="User.promotion_id", back_populates="promotion")
    modules = relationship("Module", back_populates="promotion", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    nom = Column(String(150), nullable=False)
    code = Column(String(30), nullable=False)
    coefficient = Column(Float, default=1.0, nullable=False)
    semestre = Column(Integer, default=1, nullable=False)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False)
    enseignant_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    promotion = relationship("Promotion", back_populates="modules")
    enseignant = relationship("User", foreign_keys=[enseignant_id])
    evaluations = relationship("Evaluation", back_populates="module", cascade="all, delete-orphan")
    absences = relationship("Absence", back_populates="module", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)  # e.g., "Controle 1", "Examen final"
    type = Column(String(30), nullable=False)  # devoir, tp, examen
    coefficient = Column(Float, default=1.0, nullable=False)
    bareme_max = Column(Float, default=20.0, nullable=False)
    date = Column(Date, nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)

    module = relationship("Module", back_populates="evaluations")
    notes = relationship("Note", back_populates="evaluation", cascade="all, delete-orphan")


class Inscription(Base):
    """Link table: which students are enrolled in which modules."""
    __tablename__ = "inscriptions"
    __table_args__ = (UniqueConstraint("etudiant_id", "module_id", name="uq_inscription"),)

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
