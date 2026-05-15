from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlerteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    etudiant_id: int
    etudiant_nom: Optional[str] = None
    type: str
    urgence: str
    titre: str
    message: str
    lue: bool
    score_risque: Optional[int] = None
    created_at: datetime
