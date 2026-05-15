from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import Role


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: Role


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    cne: Optional[str] = None
    promotion_id: Optional[int] = None
    filiere_dirigee_id: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    cne: Optional[str] = None
    promotion_id: Optional[int] = None
    filiere_dirigee_id: Optional[int] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    is_active: bool
    cne: Optional[str] = None
    promotion_id: Optional[int] = None
    filiere_dirigee_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    user_id: int
    full_name: str
