"""Absence endpoints — saisie par seance, justification, consultation."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import CurrentUser, require_enseignant
from app.models import Absence, Module, User
from app.models.user import Role
from app.schemas.absence import AbsenceBatch, AbsenceJustification, AbsenceRead
from app.services.audit_service import log_action
from app.services import alert_service


router = APIRouter()


def _absence_to_read(a: Absence) -> dict:
    return {
        "id": a.id,
        "etudiant_id": a.etudiant_id,
        "module_id": a.module_id,
        "module_nom": a.module.nom,
        "date_cours": a.date_cours,
        "justifiee": a.justifiee,
        "statut": a.statut,
        "motif_justification": a.motif_justification,
        "duree_heures": a.duree_heures,
    }


@router.post("/batch")
def saisir_absences_batch(
    payload: AbsenceBatch,
    request: Request,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == payload.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")
    if current.role == Role.enseignant and module.enseignant_id != current.id:
        raise HTTPException(status_code=403, detail="Vous n'enseignez pas ce module")

    created_ids: List[int] = []
    for etudiant_id in payload.etudiants_absents:
        # Skip duplicate (same student, same module, same day)
        existing = db.query(Absence).filter(
            Absence.etudiant_id == etudiant_id,
            Absence.module_id == payload.module_id,
            Absence.date_cours == payload.date_cours,
        ).first()
        if existing:
            continue

        abs_ = Absence(
            etudiant_id=etudiant_id,
            module_id=payload.module_id,
            date_cours=payload.date_cours,
            duree_heures=payload.duree_heures,
            justifiee=False,
            statut="non_justifiee",
            saisie_par=current.id,
        )
        db.add(abs_)
        db.flush()
        log_action(
            db, user=current, table_name="absences", record_id=abs_.id,
            action="create",
            nouvelle_valeur={"etudiant_id": etudiant_id, "module_id": payload.module_id, "date_cours": str(payload.date_cours)},
            request=request,
        )
        created_ids.append(abs_.id)

        # Threshold check
        student = db.query(User).filter(User.id == etudiant_id).first()
        if student:
            alert_service.generate_threshold_alerts_for_student(db, student)

    db.commit()
    return {"crees": len(created_ids), "ids": created_ids}


@router.patch("/{absence_id}/justifier")
def justifier_absence(
    absence_id: int,
    payload: AbsenceJustification,
    request: Request,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    absence = db.query(Absence).filter(Absence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Absence introuvable")

    before = {"justifiee": absence.justifiee, "statut": absence.statut, "motif": absence.motif_justification}
    absence.justifiee = True
    absence.statut = "justifiee"
    absence.motif_justification = payload.motif_justification

    db.flush()
    log_action(
        db, user=current, table_name="absences", record_id=absence.id,
        action="update", ancienne_valeur=before,
        nouvelle_valeur={"justifiee": True, "statut": "justifiee", "motif": payload.motif_justification},
        raison_modification="Justification recue", request=request,
    )
    db.commit()
    return {"id": absence.id, "justifiee": True, "statut": "justifiee"}


@router.get("/etudiant/{etudiant_id}", response_model=List[AbsenceRead])
def absences_etudiant(
    etudiant_id: int,
    current: CurrentUser,
    db: Session = Depends(get_db),
):
    if current.role == Role.etudiant and current.id != etudiant_id:
        raise HTTPException(status_code=403, detail="Acces refuse")
    absences = (
        db.query(Absence)
        .options(joinedload(Absence.module))
        .filter(Absence.etudiant_id == etudiant_id)
        .order_by(Absence.date_cours.desc())
        .all()
    )
    return [_absence_to_read(a) for a in absences]
