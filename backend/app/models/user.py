"""
User model with role-based access control.
Roles: admin, chef_filiere, enseignant, etudiant.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Role(str, enum.Enum):
    admin = "admin"
    chef_filiere = "chef_filiere"
    enseignant = "enseignant"
    etudiant = "etudiant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(Role), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Etudiant-specific fields
    cne = Column(String(20), unique=True, nullable=True, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=True)

    # Chef de filiere supervises one filiere
    filiere_dirigee_id = Column(Integer, ForeignKey("filieres.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    promotion = relationship("Promotion", foreign_keys=[promotion_id], back_populates="etudiants")
    filiere_dirigee = relationship("Filiere", foreign_keys=[filiere_dirigee_id])
    notes = relationship("Note", foreign_keys="Note.etudiant_id", back_populates="etudiant", cascade="all, delete-orphan")
    absences = relationship("Absence", foreign_keys="Absence.etudiant_id", back_populates="etudiant", cascade="all, delete-orphan")
    alertes = relationship("Alerte", foreign_keys="Alerte.etudiant_id", back_populates="etudiant", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
