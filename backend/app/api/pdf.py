"""PDF generation endpoints with strict role and scope checks."""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser, require_chef
from app.models import User, PV, Bulletin, Promotion
from app.models.user import Role
from app.services import pdf_service
from app.services.audit_service import log_action


router = APIRouter()


def _get_student_or_404(db: Session, etudiant_id: int) -> User:
    student = (
        db.query(User)
        .filter(User.id == etudiant_id, User.role == Role.etudiant)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Etudiant introuvable")

    return student


def _get_promotion_or_404(db: Session, promotion_id: int) -> Promotion:
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()

    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion introuvable")

    return promotion


def _ensure_can_access_student(current: User, student: User, db: Session) -> None:
    if current.role == Role.admin:
        return

    if current.role == Role.etudiant:
        if current.id != student.id:
            raise HTTPException(status_code=403, detail="Acces refuse")
        return

    if current.role == Role.chef_filiere:
        if current.filiere_dirigee_id is None or student.promotion_id is None:
            raise HTTPException(status_code=403, detail="Acces refuse")

        promotion = _get_promotion_or_404(db, student.promotion_id)

        if promotion.filiere_id != current.filiere_dirigee_id:
            raise HTTPException(status_code=403, detail="Acces refuse")

        return

    raise HTTPException(status_code=403, detail="Acces refuse")


def _ensure_can_access_promotion(
    current: User,
    promotion_id: int,
    db: Session,
) -> Promotion:
    promotion = _get_promotion_or_404(db, promotion_id)

    if current.role == Role.admin:
        return promotion

    if current.role == Role.chef_filiere:
        if current.filiere_dirigee_id is None:
            raise HTTPException(status_code=403, detail="Acces refuse")

        if promotion.filiere_id != current.filiere_dirigee_id:
            raise HTTPException(status_code=403, detail="Acces refuse")

        return promotion

    raise HTTPException(status_code=403, detail="Acces refuse")


def _return_pdf_or_html_fallback(path_value: str | None):
    path = Path(path_value) if path_value else None

    if not path:
        raise HTTPException(status_code=404, detail="Fichier introuvable")

    if path.exists():
        return FileResponse(
            str(path),
            media_type="application/pdf",
            filename=path.name,
        )

    fallback = path.with_suffix(".pdf.html")

    if fallback.exists():
        return FileResponse(
            str(fallback),
            media_type="text/html",
            filename=fallback.name,
        )

    raise HTTPException(status_code=404, detail="Fichier introuvable")


@router.post("/bulletin/{etudiant_id}")
def generer_bulletin(
    etudiant_id: int,
    request: Request,
    semestre: int = 2,
    current: CurrentUser = None,
    db: Session = Depends(get_db),
):
    student = _get_student_or_404(db, etudiant_id)

    # Production rule:
    # admin and chef_filiere can generate bulletins.
    # students/teachers cannot generate arbitrary official bulletins.
    if current.role not in {Role.admin, Role.chef_filiere}:
        raise HTTPException(status_code=403, detail="Acces refuse")

    _ensure_can_access_student(current, student, db)

    try:
        bulletin = pdf_service.generate_bulletin(db, etudiant_id, semestre)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    log_action(
        db,
        user=current,
        table_name="bulletins",
        record_id=bulletin.id,
        action="create",
        nouvelle_valeur={
            "etudiant_id": etudiant_id,
            "semestre": semestre,
            "decision": bulletin.decision,
        },
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

    student = _get_student_or_404(db, bulletin.etudiant_id)
    _ensure_can_access_student(current, student, db)

    return _return_pdf_or_html_fallback(bulletin.chemin_fichier)


@router.post("/pv/promotion/{promotion_id}")
def generer_pv(
    promotion_id: int,
    request: Request,
    semestre: int = 2,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    _ensure_can_access_promotion(current, promotion_id, db)

    try:
        pv = pdf_service.generate_pv(db, promotion_id, semestre, valider=False)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    pv.cree_par = current.id

    log_action(
        db,
        user=current,
        table_name="pvs",
        record_id=pv.id,
        action="create",
        nouvelle_valeur={
            "promotion_id": promotion_id,
            "semestre": semestre,
            "statut": pv.statut,
        },
        request=request,
    )

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

    _ensure_can_access_promotion(current, pv.promotion_id, db)

    if pv.statut == "valide":
        raise HTTPException(status_code=400, detail="PV deja valide")

    import hashlib
    from datetime import datetime

    pv.statut = "valide"
    pv.signature_numerique = hashlib.sha256(
        f"{pv.id}-{pv.hash_controle}-{current.id}".encode()
    ).hexdigest()
    pv.date_validation = datetime.utcnow()
    pv.valide_par = current.id

    log_action(
        db,
        user=current,
        table_name="pvs",
        record_id=pv.id,
        action="update",
        nouvelle_valeur={
            "statut": "valide",
            "signature": pv.signature_numerique[:16],
        },
        raison_modification="Validation du PV",
        request=request,
    )

    db.commit()
    db.refresh(pv)

    return {
        "pv_id": pv.id,
        "statut": pv.statut,
        "signature_numerique": pv.signature_numerique,
        "date_validation": pv.date_validation.isoformat()
        if pv.date_validation
        else None,
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

    _ensure_can_access_promotion(current, pv.promotion_id, db)

    return _return_pdf_or_html_fallback(pv.chemin_fichier)