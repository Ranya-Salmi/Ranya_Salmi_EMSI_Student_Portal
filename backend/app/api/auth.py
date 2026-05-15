"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserRead
from app.security import verify_password, create_access_token


router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte desactive")

    token = create_access_token(subject=user.id, role=user.role.value)
    return LoginResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserRead)
def me(current_user: CurrentUser):
    return current_user
