from typing import Optional, List
from datetime import date
from pydantic import BaseModel, ConfigDict


class FiliereBase(BaseModel):
    nom: str
    code: str
    description: Optional[str] = None


class FiliereCreate(FiliereBase):
    pass


class FiliereRead(FiliereBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PromotionBase(BaseModel):
    nom: str
    annee: str
    filiere_id: int


class PromotionCreate(PromotionBase):
    pass


class PromotionRead(PromotionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ModuleBase(BaseModel):
    nom: str
    code: str
    coefficient: float = 1.0
    semestre: int = 1
    promotion_id: int
    enseignant_id: Optional[int] = None


class ModuleCreate(ModuleBase):
    pass


class ModuleRead(ModuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EvaluationBase(BaseModel):
    nom: str
    type: str
    coefficient: float = 1.0
    bareme_max: float = 20.0
    date: Optional[date] = None
    module_id: int


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationRead(EvaluationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
