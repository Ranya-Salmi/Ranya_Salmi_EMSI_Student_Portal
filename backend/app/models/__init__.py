"""All SQLAlchemy models — imported here so Alembic and Base.metadata can find them."""
from app.models.user import User, Role
from app.models.academic import Filiere, Promotion, Module, Evaluation, Inscription
from app.models.note import Note
from app.models.absence import Absence
from app.models.alerte import Alerte
from app.models.audit import AuditLog
from app.models.pv import PV, Bulletin

__all__ = [
    "User",
    "Role",
    "Filiere",
    "Promotion",
    "Module",
    "Evaluation",
    "Inscription",
    "Note",
    "Absence",
    "Alerte",
    "AuditLog",
    "PV",
    "Bulletin",
]
