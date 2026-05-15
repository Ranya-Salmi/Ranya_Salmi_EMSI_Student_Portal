from app.schemas.user import UserRead, UserCreate, UserUpdate, LoginRequest, LoginResponse, Token
from app.schemas.note import NoteRead, NoteCreate, NoteUpdate
from app.schemas.absence import AbsenceRead, AbsenceCreate, AbsenceJustification, AbsenceBatch
from app.schemas.alerte import AlerteRead
from app.schemas.audit import AuditLogRead
from app.schemas.dashboard import KPIs, EtudiantRisque, ModuleStats, RecapEtudiant
from app.schemas.academic import (
    FiliereRead, FiliereCreate,
    PromotionRead, PromotionCreate,
    ModuleRead, ModuleCreate,
    EvaluationRead, EvaluationCreate,
)
