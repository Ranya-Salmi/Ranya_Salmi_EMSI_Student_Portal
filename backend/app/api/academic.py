"""Academic structure CRUD — admin and chef_filiere."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin, require_chef, require_any
from app.models import Filiere, Promotion, Module, Evaluation
from app.models.user import User
from app.schemas.academic import (
    FiliereRead, FiliereCreate,
    PromotionRead, PromotionCreate,
    ModuleRead, ModuleCreate,
    EvaluationRead, EvaluationCreate,
)


router = APIRouter()


# ---------- Filieres ----------

@router.get("/filieres", response_model=List[FiliereRead])
def list_filieres(db: Session = Depends(get_db), _: User = Depends(require_any)):
    return db.query(Filiere).order_by(Filiere.nom).all()


@router.post("/filieres", response_model=FiliereRead, status_code=201)
def create_filiere(p: FiliereCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    f = Filiere(**p.model_dump())
    db.add(f); db.commit(); db.refresh(f)
    return f


# ---------- Promotions ----------

@router.get("/promotions", response_model=List[PromotionRead])
def list_promotions(db: Session = Depends(get_db), _: User = Depends(require_any)):
    return db.query(Promotion).order_by(Promotion.nom).all()


@router.post("/promotions", response_model=PromotionRead, status_code=201)
def create_promotion(p: PromotionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    pr = Promotion(**p.model_dump())
    db.add(pr); db.commit(); db.refresh(pr)
    return pr


# ---------- Modules ----------

@router.get("/modules", response_model=List[ModuleRead])
def list_modules(
    promotion_id: int | None = None,
    enseignant_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_any),
):
    q = db.query(Module)
    if promotion_id is not None:
        q = q.filter(Module.promotion_id == promotion_id)
    if enseignant_id is not None:
        q = q.filter(Module.enseignant_id == enseignant_id)
    return q.order_by(Module.nom).all()


@router.post("/modules", response_model=ModuleRead, status_code=201)
def create_module(p: ModuleCreate, db: Session = Depends(get_db), _: User = Depends(require_chef)):
    m = Module(**p.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    return m


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
def create_evaluation(p: EvaluationCreate, db: Session = Depends(get_db), _: User = Depends(require_chef)):
    e = Evaluation(**p.model_dump())
    db.add(e); db.commit(); db.refresh(e)
    return e
