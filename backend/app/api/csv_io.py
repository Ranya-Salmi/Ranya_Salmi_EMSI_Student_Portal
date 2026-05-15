"""CSV import/export endpoints — notes per module."""
from io import StringIO
import csv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_enseignant
from app.models import Note, Evaluation, Module, User
from app.models.user import Role
from app.services.audit_service import log_action


router = APIRouter()


@router.post("/notes/import")
async def import_notes(
    file: UploadFile = File(...),
    request: Request = None,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    """
    Expected CSV columns: etudiant_cne, evaluation_id, valeur
    """
    content = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(StringIO(content))

    importes = 0
    erreurs: list[str] = []

    for i, row in enumerate(reader, start=2):  # row 1 is header
        cne = (row.get("etudiant_cne") or "").strip()
        eval_id_str = (row.get("evaluation_id") or "").strip()
        valeur_str = (row.get("valeur") or "").strip()

        if not cne or not eval_id_str:
            erreurs.append(f"Ligne {i}: cne ou evaluation_id manquant")
            continue

        try:
            eval_id = int(eval_id_str)
            valeur = float(valeur_str.replace(",", ".")) if valeur_str else None
        except ValueError:
            erreurs.append(f"Ligne {i}: format invalide")
            continue

        etu = db.query(User).filter(User.cne == cne, User.role == Role.etudiant).first()
        if not etu:
            erreurs.append(f"Ligne {i}: etudiant CNE={cne} introuvable")
            continue

        evaluation = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
        if not evaluation:
            erreurs.append(f"Ligne {i}: evaluation {eval_id} introuvable")
            continue

        if current.role == Role.enseignant and evaluation.module.enseignant_id != current.id:
            erreurs.append(f"Ligne {i}: vous n'enseignez pas ce module")
            continue

        if valeur is not None and not (0 <= valeur <= evaluation.bareme_max):
            erreurs.append(f"Ligne {i}: note {valeur} hors bareme")
            continue

        existing = db.query(Note).filter(
            Note.etudiant_id == etu.id, Note.evaluation_id == eval_id,
        ).first()

        if existing:
            before = {"valeur": existing.valeur}
            existing.valeur = valeur
            existing.saisie_par = current.id
            db.flush()
            log_action(
                db, user=current, table_name="notes", record_id=existing.id,
                action="update", ancienne_valeur=before,
                nouvelle_valeur={"valeur": valeur},
                raison_modification=f"Import CSV ({file.filename})", request=request,
            )
        else:
            n = Note(etudiant_id=etu.id, evaluation_id=eval_id, valeur=valeur, saisie_par=current.id)
            db.add(n); db.flush()
            log_action(
                db, user=current, table_name="notes", record_id=n.id, action="create",
                nouvelle_valeur={"valeur": valeur},
                raison_modification=f"Import CSV ({file.filename})", request=request,
            )

        importes += 1

    db.commit()
    return {"importes": importes, "erreurs": erreurs}


@router.get("/notes/export/module/{module_id}")
def export_notes_module(
    module_id: int,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")
    if current.role == Role.enseignant and module.enseignant_id != current.id:
        raise HTTPException(status_code=403, detail="Vous n'enseignez pas ce module")

    rows = (
        db.query(Note, User, Evaluation)
        .join(User, Note.etudiant_id == User.id)
        .join(Evaluation, Note.evaluation_id == Evaluation.id)
        .filter(Evaluation.module_id == module_id)
        .order_by(User.last_name, Evaluation.date)
        .all()
    )

    def iter_csv():
        buf = StringIO()
        w = csv.writer(buf)
        w.writerow(["cne", "nom", "prenom", "evaluation_id", "evaluation_nom", "valeur", "bareme_max"])
        yield buf.getvalue(); buf.seek(0); buf.truncate(0)
        for note, etu, ev in rows:
            w.writerow([
                etu.cne or "", etu.last_name, etu.first_name,
                ev.id, ev.nom, note.valeur if note.valeur is not None else "", ev.bareme_max,
            ])
            yield buf.getvalue(); buf.seek(0); buf.truncate(0)

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="notes_module_{module_id}.csv"'},
    )
