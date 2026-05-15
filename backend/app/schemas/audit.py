from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    user_email: str
    table_name: str
    record_id: int
    action: str
    ancienne_valeur: Optional[Any] = None
    nouvelle_valeur: Optional[Any] = None
    raison_modification: Optional[str] = None
    timestamp: datetime
    ip_adresse: Optional[str] = None
