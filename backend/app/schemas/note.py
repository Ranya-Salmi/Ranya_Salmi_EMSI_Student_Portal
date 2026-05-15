from datetime import date as Date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    etudiant_id: int
    evaluation_id: int
    valeur: Optional[float] = Field(None, ge=0, le=20)


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    valeur: Optional[float] = Field(None, ge=0, le=20)
    statut: Optional[str] = None
    raison_modification: Optional[str] = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    etudiant_id: int
    evaluation_id: int
    evaluation_nom: str
    module_nom: str
    module_id: int
    valeur: Optional[float] = None
    coefficient: float
    bareme_max: float
    date: Optional[Date] = None
    statut: str