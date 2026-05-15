from typing import Optional, List
from datetime import date
from pydantic import BaseModel, ConfigDict


class AbsenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    etudiant_id: int
    module_id: int
    module_nom: str
    date_cours: date
    justifiee: bool
    statut: str
    motif_justification: Optional[str] = None
    duree_heures: int


class AbsenceCreate(BaseModel):
    etudiant_id: int
    module_id: int
    date_cours: date
    duree_heures: int = 2


class AbsenceJustification(BaseModel):
    motif_justification: str


class AbsenceBatch(BaseModel):
    module_id: int
    date_cours: date
    etudiants_absents: List[int]
    duree_heures: int = 2
