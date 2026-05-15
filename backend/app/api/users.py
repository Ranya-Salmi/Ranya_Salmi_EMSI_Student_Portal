"""User management — admin only."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin, CurrentUser
from app.models.user import User, Role
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.security import hash_password
from app.services.audit_service import log_action


router = APIRouter()


def _user_snapshot(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "role": u.role.value if u.role else None,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "is_active": u.is_active,
    }


@router.get("/users", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id).all()


@router.post("/users", response_model=UserRead, status_code=201)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email deja utilise")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        cne=payload.cne,
        promotion_id=payload.promotion_id,
        filiere_dirigee_id=payload.filiere_dirigee_id,
    )
    db.add(user)
    db.flush()
    log_action(
        db, user=current, table_name="users", record_id=user.id,
        action="create", nouvelle_valeur=_user_snapshot(user), request=request,
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    before = _user_snapshot(user)

    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        pwd = data.pop("password")
        if pwd:
            user.password_hash = hash_password(pwd)
    for k, v in data.items():
        setattr(user, k, v)

    db.flush()
    log_action(
        db, user=current, table_name="users", record_id=user.id,
        action="update", ancienne_valeur=before, nouvelle_valeur=_user_snapshot(user),
        request=request,
    )
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    before = _user_snapshot(user)
    user.is_active = False
    db.flush()
    log_action(
        db, user=current, table_name="users", record_id=user.id,
        action="update", ancienne_valeur=before, nouvelle_valeur=_user_snapshot(user),
        raison_modification="Desactivation compte", request=request,
    )
    db.commit()
    return {"id": user.id, "is_active": False}
