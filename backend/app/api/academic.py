"""Academic structure CRUD — admin, chef_filiere, enseignant and etudiant."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin, require_chef, require_any
from app.models import (
    Filiere,
    Promotion,
    Module,
    Evaluation,
    Inscription,
    Absence,
    Note,
)
from app.models.user import User, Role
from app.schemas.academic import (
    FiliereRead,
    FiliereCreate,
    PromotionRead,
    PromotionCreate,
    ModuleRead,
    ModuleCreate,
    EvaluationRead,
    EvaluationCreate,
)


router = APIRouter()


class ModuleEtudiantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    cne: Optional[str] = None
    email: str
    taux_absence: float = 0.0
    moyenne_generale: float = 0.0


def _compute_student_module_average(
    db: Session,
    etudiant_id: int,
    module_id: int,
) -> float:
    """Calculate the real weighted average of one student in one module.

    Average = sum(note * evaluation.coefficient) / sum(evaluation.coefficient)
    Only non-null notes are counted.
    """

    rows = (
        db.query(Note.valeur, Evaluation.coefficient)
        .join(Evaluation, Note.evaluation_id == Evaluation.id)
        .filter(
            Note.etudiant_id == etudiant_id,
            Evaluation.module_id == module_id,
            Note.valeur.isnot(None),
        )
        .all()
    )

    if not rows:
        return 0.0

    total_weighted = 0.0
    total_coeff = 0.0

    for valeur, coefficient in rows:
        coeff = float(coefficient or 1.0)
        total_weighted += float(valeur) * coeff
        total_coeff += coeff

    if total_coeff == 0:
        return 0.0

    return round(total_weighted / total_coeff, 2)


def _compute_student_module_absence_rate(
    db: Session,
    etudiant_id: int,
    module_id: int,
) -> float:
    """Calculate absence rate for one student in one module.

    For the demo, 20 hours is used as the reference volume per module.
    The value is capped at 100%.
    """

    absence_hours = (
        db.query(func.coalesce(func.sum(Absence.duree_heures), 0))
        .filter(
            Absence.etudiant_id == etudiant_id,
            Absence.module_id == module_id,
        )
        .scalar()
        or 0
    )

    taux_absence = min(float(absence_hours) / 20.0 * 100.0, 100.0)

    return round(taux_absence, 2)


def _check_module_access(module: Module, current: User, db: Session) -> None:
    """Role-based access control for module-related endpoints."""

    if current.role == Role.admin:
        return

    if current.role == Role.enseignant:
        if module.enseignant_id != current.id:
            raise HTTPException(
                status_code=403,
                detail="Acces refuse. Ce module n'est pas affecte a cet enseignant.",
            )
        return

    if current.role == Role.chef_filiere:
        if current.filiere_dirigee_id is None:
            raise HTTPException(
                status_code=403,
                detail="Acces refuse. Aucune filiere dirigee.",
            )

        promotion = (
            db.query(Promotion)
            .filter(Promotion.id == module.promotion_id)
            .first()
        )

        if not promotion or promotion.filiere_id != current.filiere_dirigee_id:
            raise HTTPException(
                status_code=403,
                detail="Acces refuse. Module hors filiere.",
            )
        return

    if current.role == Role.etudiant:
        if current.promotion_id != module.promotion_id:
            raise HTTPException(
                status_code=403,
                detail="Acces refuse. Module hors promotion.",
            )
        return

    raise HTTPException(status_code=403, detail="Acces refuse.")


# ---------- Filieres ----------

@router.get("/filieres", response_model=List[FiliereRead])
def list_filieres(
    db: Session = Depends(get_db),
    _: User = Depends(require_any),
):
    return db.query(Filiere).order_by(Filiere.nom).all()


@router.post("/filieres", response_model=FiliereRead, status_code=201)
def create_filiere(
    p: FiliereCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    filiere = Filiere(**p.model_dump())

    db.add(filiere)
    db.commit()
    db.refresh(filiere)

    return filiere


# ---------- Promotions ----------

@router.get("/promotions", response_model=List[PromotionRead])
def list_promotions(
    db: Session = Depends(get_db),
    _: User = Depends(require_any),
):
    return db.query(Promotion).order_by(Promotion.nom).all()


@router.post("/promotions", response_model=PromotionRead, status_code=201)
def create_promotion(
    p: PromotionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    promotion = Promotion(**p.model_dump())

    db.add(promotion)
    db.commit()
    db.refresh(promotion)

    return promotion


# ---------- Modules ----------

@router.get("/modules", response_model=List[ModuleRead])
def list_modules(
    promotion_id: int | None = None,
    enseignant_id: int | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_any),
):
    q = db.query(Module)

    if promotion_id is not None:
        q = q.filter(Module.promotion_id == promotion_id)

    if enseignant_id is not None:
        q = q.filter(Module.enseignant_id == enseignant_id)

    if current.role == Role.enseignant:
        q = q.filter(Module.enseignant_id == current.id)

    if current.role == Role.etudiant and current.promotion_id is not None:
        q = q.filter(Module.promotion_id == current.promotion_id)

    if current.role == Role.chef_filiere and current.filiere_dirigee_id is not None:
        q = (
            q.join(Promotion, Module.promotion_id == Promotion.id)
            .filter(Promotion.filiere_id == current.filiere_dirigee_id)
        )

    return q.order_by(Module.nom).all()


@router.get(
    "/modules/{module_id}/etudiants",
    response_model=List[ModuleEtudiantRead],
)
def list_module_etudiants(
    module_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_any),
):
    module = db.query(Module).filter(Module.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")

    _check_module_access(module, current, db)

    students = (
        db.query(User)
        .join(Inscription, Inscription.etudiant_id == User.id)
        .filter(
            Inscription.module_id == module_id,
            Inscription.active == True,  # noqa: E712
            User.role == Role.etudiant,
            User.is_active == True,  # noqa: E712
        )
        .order_by(User.last_name, User.first_name)
        .all()
    )

    # Fallback: if inscriptions are not populated, use the module promotion.
    if not students:
        students = (
            db.query(User)
            .filter(
                User.role == Role.etudiant,
                User.is_active == True,  # noqa: E712
                User.promotion_id == module.promotion_id,
            )
            .order_by(User.last_name, User.first_name)
            .all()
        )

    result: list[ModuleEtudiantRead] = []

    for student in students:
        taux_absence = _compute_student_module_absence_rate(
            db=db,
            etudiant_id=student.id,
            module_id=module_id,
        )

        moyenne_generale = _compute_student_module_average(
            db=db,
            etudiant_id=student.id,
            module_id=module_id,
        )

        result.append(
            ModuleEtudiantRead(
                id=student.id,
                full_name=student.full_name,
                cne=student.cne,
                email=student.email,
                taux_absence=taux_absence,
                moyenne_generale=moyenne_generale,
            )
        )

    return result


@router.post("/modules", response_model=ModuleRead, status_code=201)
def create_module(
    p: ModuleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_chef),
):
    module = Module(**p.model_dump())

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


# ---------- Evaluations ----------

@router.get("/evaluations", response_model=List[EvaluationRead])
def list_evaluations(
    module_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_any),
):
    q = db.query(Evaluation)

    if module_id is not None:
        q = q.filter(Evaluation.module_id == module_id)

    return q.order_by(Evaluation.date.desc()).all()


@router.post("/evaluations", response_model=EvaluationRead, status_code=201)
def create_evaluation(
    p: EvaluationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_chef),
):
    evaluation = Evaluation(**p.model_dump())

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return evaluation