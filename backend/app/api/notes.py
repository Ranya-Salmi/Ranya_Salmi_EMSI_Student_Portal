"""Notes endpoints — saisie, modification, consultation."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import CurrentUser, require_enseignant, require_any
from app.models import Note, Evaluation, Module, User
from app.models.user import Role
from app.schemas.note import NoteCreate, NoteUpdate, NoteRead
from app.services.audit_service import log_action
from app.services import alert_service


router = APIRouter()


def _note_to_read(note: Note) -> dict:
    return {
        "id": note.id,
        "etudiant_id": note.etudiant_id,
        "evaluation_id": note.evaluation_id,
        "evaluation_nom": note.evaluation.nom,
        "module_id": note.evaluation.module_id,
        "module_nom": note.evaluation.module.nom,
        "valeur": note.valeur,
        "coefficient": note.evaluation.coefficient,
        "bareme_max": note.evaluation.bareme_max,
        "date": note.evaluation.date,
        "statut": note.statut,
    }


@router.post("", response_model=NoteRead, status_code=201)
def saisir_note(
    payload: NoteCreate,
    request: Request,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    evaluation = db.query(Evaluation).filter(Evaluation.id == payload.evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation introuvable")

    # Permission: enseignants can only enter notes for modules they teach
    if current.role == Role.enseignant and evaluation.module.enseignant_id != current.id:
        raise HTTPException(status_code=403, detail="Vous n'enseignez pas ce module")

    if payload.valeur is not None and not (0 <= payload.valeur <= evaluation.bareme_max):
        raise HTTPException(status_code=400, detail=f"Note hors bareme (0 - {evaluation.bareme_max})")

    existing = db.query(Note).filter(
        Note.etudiant_id == payload.etudiant_id,
        Note.evaluation_id == payload.evaluation_id,
    ).first()

    if existing:
        before = {"valeur": existing.valeur, "statut": existing.statut}
        existing.valeur = payload.valeur
        existing.saisie_par = current.id
        db.flush()
        log_action(
            db, user=current, table_name="notes", record_id=existing.id,
            action="update", ancienne_valeur=before,
            nouvelle_valeur={"valeur": existing.valeur, "statut": existing.statut},
            request=request,
        )
        note = existing
    else:
        note = Note(
            etudiant_id=payload.etudiant_id,
            evaluation_id=payload.evaluation_id,
            valeur=payload.valeur,
            saisie_par=current.id,
        )
        db.add(note)
        db.flush()
        log_action(
            db, user=current, table_name="notes", record_id=note.id,
            action="create", nouvelle_valeur={"valeur": note.valeur},
            request=request,
        )

    # Trigger alert checks after every note change
    student = db.query(User).filter(User.id == payload.etudiant_id).first()
    if student:
        alert_service.generate_threshold_alerts_for_student(db, student)

    db.commit()

    # Reload with relationships
    note = (
        db.query(Note)
        .options(joinedload(Note.evaluation).joinedload(Evaluation.module))
        .filter(Note.id == note.id)
        .first()
    )
    return _note_to_read(note)


@router.patch("/{note_id}", response_model=NoteRead)
def modifier_note(
    note_id: int,
    payload: NoteUpdate,
    request: Request,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    note = (
        db.query(Note)
        .options(joinedload(Note.evaluation).joinedload(Evaluation.module))
        .filter(Note.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")

    if current.role == Role.enseignant and note.evaluation.module.enseignant_id != current.id:
        raise HTTPException(status_code=403, detail="Vous n'enseignez pas ce module")

    before = {"valeur": note.valeur, "statut": note.statut}

    if payload.valeur is not None:
        if not (0 <= payload.valeur <= note.evaluation.bareme_max):
            raise HTTPException(status_code=400, detail=f"Note hors bareme")
        note.valeur = payload.valeur
    if payload.statut:
        note.statut = payload.statut
    note.saisie_par = current.id

    db.flush()
    log_action(
        db, user=current, table_name="notes", record_id=note.id,
        action="update", ancienne_valeur=before,
        nouvelle_valeur={"valeur": note.valeur, "statut": note.statut},
        raison_modification=payload.raison_modification,
        request=request,
    )

    student = db.query(User).filter(User.id == note.etudiant_id).first()
    if student:
        alert_service.generate_threshold_alerts_for_student(db, student)

    db.commit()
    db.refresh(note)
    return _note_to_read(note)


@router.get("/etudiant/{etudiant_id}", response_model=List[NoteRead])
def notes_etudiant(
    etudiant_id: int,
    current: CurrentUser,
    db: Session = Depends(get_db),
):
    # Etudiants can only see their own notes
    if current.role == Role.etudiant and current.id != etudiant_id:
        raise HTTPException(status_code=403, detail="Acces refuse")

    notes = (
        db.query(Note)
        .options(joinedload(Note.evaluation).joinedload(Evaluation.module))
        .filter(Note.etudiant_id == etudiant_id)
        .all()
    )
    return [_note_to_read(n) for n in notes]


@router.get("/module/{module_id}", response_model=List[NoteRead])
def notes_module(
    module_id: int,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")
    if current.role == Role.enseignant and module.enseignant_id != current.id:
        raise HTTPException(status_code=403, detail="Vous n'enseignez pas ce module")

    notes = (
        db.query(Note)
        .join(Evaluation, Note.evaluation_id == Evaluation.id)
        .options(joinedload(Note.evaluation).joinedload(Evaluation.module))
        .filter(Evaluation.module_id == module_id)
        .all()
    )
    return [_note_to_read(n) for n in notes]
