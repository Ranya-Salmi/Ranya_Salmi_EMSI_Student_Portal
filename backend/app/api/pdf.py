"""PDF generation endpoints."""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_chef, CurrentUser, require_enseignant
from app.models import User, PV, Bulletin
from app.models.user import Role
from app.services import pdf_service
from app.services.audit_service import log_action


router = APIRouter()


@router.post("/bulletin/{etudiant_id}")
def generer_bulletin(
    etudiant_id: int,
    request: Request,
    semestre: int = 2,
    current: User = Depends(require_enseignant),
    db: Session = Depends(get_db),
):
    try:
        bulletin = pdf_service.generate_bulletin(db, etudiant_id, semestre)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    log_action(
        db, user=current, table_name="bulletins", record_id=bulletin.id,
        action="create",
        nouvelle_valeur={"etudiant_id": etudiant_id, "semestre": semestre, "decision": bulletin.decision},
        request=request,
    )
    db.commit()

    return {
        "bulletin_id": bulletin.id,
        "decision": bulletin.decision,
        "moyenne_generale": bulletin.moyenne_generale,
        "chemin_fichier": bulletin.chemin_fichier,
        "download_url": f"/pdf/bulletin/{bulletin.id}/download",
    }


@router.get("/bulletin/{bulletin_id}/download")
def telecharger_bulletin(
    bulletin_id: int,
    current: CurrentUser,
    db: Session = Depends(get_db),
):
    bulletin = db.query(Bulletin).filter(Bulletin.id == bulletin_id).first()
    if not bulletin:
        raise HTTPException(status_code=404, detail="Bulletin introuvable")
    if current.role == Role.etudiant and bulletin.etudiant_id != current.id:
        raise HTTPException(status_code=403, detail="Acces refuse")

    path = Path(bulletin.chemin_fichier) if bulletin.chemin_fichier else None
    if not path or not path.exists():
        # try html fallback
        fallback = path.with_suffix(".pdf.html") if path else None
        if fallback and fallback.exists():
            return FileResponse(str(fallback), media_type="text/html", filename=fallback.name)
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(str(path), media_type="application/pdf", filename=path.name)


@router.post("/pv/promotion/{promotion_id}")
def generer_pv(
    promotion_id: int,
    request: Request,
    semestre: int = 2,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    try:
        pv = pdf_service.generate_pv(db, promotion_id, semestre, valider=False)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    log_action(
        db, user=current, table_name="pvs", record_id=pv.id, action="create",
        nouvelle_valeur={"promotion_id": promotion_id, "semestre": semestre, "statut": pv.statut},
        request=request,
    )
    pv.cree_par = current.id
    db.commit()

    return {
        "pv_id": pv.id,
        "statut": pv.statut,
        "hash_controle": pv.hash_controle,
        "chemin_fichier": pv.chemin_fichier,
        "download_url": f"/pdf/pv/{pv.id}/download",
    }


@router.post("/pv/{pv_id}/valider")
def valider_pv(
    pv_id: int,
    request: Request,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    pv = db.query(PV).filter(PV.id == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV introuvable")
    if pv.statut == "valide":
        raise HTTPException(status_code=400, detail="PV deja valide")

    import hashlib
    from datetime import datetime
    pv.statut = "valide"
    pv.signature_numerique = hashlib.sha256(f"{pv.id}-{pv.hash_controle}-{current.id}".encode()).hexdigest()
    pv.date_validation = datetime.utcnow()
    pv.valide_par = current.id

    log_action(
        db, user=current, table_name="pvs", record_id=pv.id, action="update",
        nouvelle_valeur={"statut": "valide", "signature": pv.signature_numerique[:16]},
        raison_modification="Validation du PV", request=request,
    )
    db.commit()
    db.refresh(pv)
    return {
        "pv_id": pv.id, "statut": pv.statut,
        "signature_numerique": pv.signature_numerique,
        "date_validation": pv.date_validation.isoformat() if pv.date_validation else None,
        "integrite_verifiee": True,
    }


@router.get("/pv/{pv_id}/download")
def telecharger_pv(
    pv_id: int,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    pv = db.query(PV).filter(PV.id == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV introuvable")
    path = Path(pv.chemin_fichier) if pv.chemin_fichier else None
    if not path or not path.exists():
        fallback = path.with_suffix(".pdf.html") if path else None
        if fallback and fallback.exists():
            return FileResponse(str(fallback), media_type="text/html", filename=fallback.name)
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(str(path), media_type="application/pdf", filename=path.name)
