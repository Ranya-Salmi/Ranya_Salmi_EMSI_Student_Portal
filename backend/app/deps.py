"""
Authentication dependencies for FastAPI.
get_current_user decodes the JWT; the role guards enforce RBAC.
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Role
from app.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifie",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token mal forme")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur inactif ou inexistant")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed_roles: Role):
    """Factory for a dependency that enforces the caller has one of the given roles."""
    def _checker(user: CurrentUser) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acces refuse. Roles requis : {[r.value for r in allowed_roles]}",
            )
        return user
    return _checker


require_admin = require_roles(Role.admin)
require_chef = require_roles(Role.admin, Role.chef_filiere)
require_enseignant = require_roles(Role.admin, Role.chef_filiere, Role.enseignant)
require_any = require_roles(Role.admin, Role.chef_filiere, Role.enseignant, Role.etudiant)
