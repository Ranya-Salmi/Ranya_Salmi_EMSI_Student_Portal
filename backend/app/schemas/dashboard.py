from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.note import NoteRead
from app.schemas.absence import AbsenceRead
from app.schemas.alerte import AlerteRead


class KPIs(BaseModel):
    nombre_etudiants: int
    moyenne_generale_filiere: float
    taux_reussite: float
    taux_absence_moyen: float
    etudiants_risque_eleve: int
    nombre_alertes_non_lues: int


class EtudiantRisque(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    cne: Optional[str] = None
    email: str
    score: int
    niveau_risque: str  # faible, modere, eleve
    couleur_alerte: str  # green, orange, red
    taux_absence: float
    moyenne_generale: float


class ModuleStats(BaseModel):
    module_id: int
    module_nom: str
    moyenne_classe: float
    taux_reussite: float
    ecart_type: float
    distribution: Dict[str, int]


class ScoreRisque(BaseModel):
    score: int
    niveau: str
    couleur: str


class EtudiantInfo(BaseModel):
    id: int
    cne: Optional[str] = None
    full_name: str
    email: str


class RecapEtudiant(BaseModel):
    etudiant: EtudiantInfo
    notes: List[NoteRead]
    absences: List[AbsenceRead]
    alertes: List[AlerteRead]
    score_risque: Optional[ScoreRisque] = None
