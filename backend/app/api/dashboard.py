"""Dashboard endpoints — KPIs, IA risk scores, module stats, alertes, recap etudiant."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import CurrentUser, require_chef, require_any
from app.models import User, Alerte, Module, Promotion, Note, Evaluation
from app.models.user import Role
from app.schemas.alerte import AlerteRead
from app.schemas.dashboard import KPIs, EtudiantRisque, ModuleStats, RecapEtudiant, ScoreRisque, EtudiantInfo
from app.services import stats_service
from app.ml.predictor import predict_risk
from app.ml.features import extract_features
from app.api.notes import _note_to_read
from app.api.absences import _absence_to_read


router = APIRouter()


def _students_in_scope(db: Session, current: User, filiere_id: Optional[int] = None) -> List[User]:
    q = db.query(User).filter(User.role == Role.etudiant, User.is_active == True)  # noqa: E712
    if current.role == Role.chef_filiere and current.filiere_dirigee_id is not None:
        q = q.join(Promotion, User.promotion_id == Promotion.id).filter(
            Promotion.filiere_id == current.filiere_dirigee_id
        )
    elif filiere_id is not None:
        q = q.join(Promotion, User.promotion_id == Promotion.id).filter(
            Promotion.filiere_id == filiere_id
        )
    return q.all()


@router.get("/kpis", response_model=KPIs)
def kpis(
    filiere_id: Optional[int] = None,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    students = _students_in_scope(db, current, filiere_id)
    n = len(students)

    if n == 0:
        return KPIs(
            nombre_etudiants=0, moyenne_generale_filiere=0,
            taux_reussite=0, taux_absence_moyen=0,
            etudiants_risque_eleve=0, nombre_alertes_non_lues=0,
        )

    avgs = []
    absences = []
    risque_eleve = 0
    for s in students:
        avg = stats_service.compute_general_average(db, s.id)
        if avg is not None:
            avgs.append(avg)
        absences.append(stats_service.compute_absence_rate(db, s.id))
        risk = predict_risk(extract_features(db, s.id))
        if risk["niveau"] == "eleve":
            risque_eleve += 1

    moyenne_filiere = sum(avgs) / len(avgs) if avgs else 0.0
    reussite = 100.0 * sum(1 for a in avgs if a >= 10) / len(avgs) if avgs else 0.0
    abs_moyen = sum(absences) / len(absences) if absences else 0.0

    alertes_non_lues = (
        db.query(Alerte)
        .filter(Alerte.etudiant_id.in_([s.id for s in students]), Alerte.lue == False)  # noqa: E712
        .count()
    )

    return KPIs(
        nombre_etudiants=n,
        moyenne_generale_filiere=round(moyenne_filiere, 2),
        taux_reussite=round(reussite, 2),
        taux_absence_moyen=round(abs_moyen, 2),
        etudiants_risque_eleve=risque_eleve,
        nombre_alertes_non_lues=alertes_non_lues,
    )


@router.get("/etudiants-risque", response_model=List[EtudiantRisque])
def etudiants_risque(
    filiere_id: Optional[int] = None,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    students = _students_in_scope(db, current, filiere_id)
    out: List[EtudiantRisque] = []
    for s in students:
        features = extract_features(db, s.id)
        risk = predict_risk(features)
        avg = stats_service.compute_general_average(db, s.id) or 0.0
        out.append(EtudiantRisque(
            id=s.id, full_name=s.full_name, cne=s.cne, email=s.email,
            score=risk["score"], niveau_risque=risk["niveau"],
            couleur_alerte=risk["couleur"],
            taux_absence=features["taux_absence"],
            moyenne_generale=avg,
        ))
    out.sort(key=lambda e: -e.score)
    return out


@router.get("/module/{module_id}/stats", response_model=ModuleStats)
def module_stats(
    module_id: int,
    _: User = Depends(require_any),
    db: Session = Depends(get_db),
):
    stats = stats_service.compute_module_stats(db, module_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Module introuvable")
    return stats


@router.get("/mes-alertes", response_model=List[AlerteRead])
def mes_alertes(
    current: CurrentUser,
    lues: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Alerts visible to the current user.

    - Etudiants see only their own.
    - Chef de filiere sees alerts for students in their filiere.
    - Admin sees all.
    """
    q = db.query(Alerte).join(User, Alerte.etudiant_id == User.id)
    if current.role == Role.etudiant:
        q = q.filter(Alerte.etudiant_id == current.id)
    elif current.role == Role.chef_filiere and current.filiere_dirigee_id is not None:
        q = q.join(Promotion, User.promotion_id == Promotion.id).filter(
            Promotion.filiere_id == current.filiere_dirigee_id
        )
    elif current.role == Role.enseignant:
        # Enseignant sees alerts for students enrolled in their modules
        from app.models import Inscription
        q = q.join(Inscription, Inscription.etudiant_id == User.id).join(
            Module, Inscription.module_id == Module.id
        ).filter(Module.enseignant_id == current.id).distinct()

    if lues is not None:
        q = q.filter(Alerte.lue == lues)

    alertes = q.order_by(Alerte.created_at.desc()).limit(100).all()
    return [
        AlerteRead(
            id=a.id, etudiant_id=a.etudiant_id,
            etudiant_nom=a.etudiant.full_name if a.etudiant else None,
            type=a.type, urgence=a.urgence, titre=a.titre,
            message=a.message, lue=a.lue, score_risque=a.score_risque,
            created_at=a.created_at,
        ) for a in alertes
    ]


@router.patch("/alertes/{alerte_id}/lue")
def marquer_alerte_lue(
    alerte_id: int,
    current: CurrentUser,
    db: Session = Depends(get_db),
):
    alerte = db.query(Alerte).filter(Alerte.id == alerte_id).first()
    if not alerte:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    if current.role == Role.etudiant and alerte.etudiant_id != current.id:
        raise HTTPException(status_code=403, detail="Acces refuse")
    alerte.lue = True
    db.commit()
    return {"id": alerte.id, "lue": True}


@router.get("/etudiant/me/recap", response_model=RecapEtudiant)
def recap_etudiant_me(current: CurrentUser, db: Session = Depends(get_db)):
    """Personal dashboard data for the currently authenticated etudiant."""
    if current.role != Role.etudiant:
        raise HTTPException(status_code=403, detail="Reserve aux etudiants")
    return _build_recap(db, current.id)


def _build_recap(db: Session, etudiant_id: int) -> RecapEtudiant:
    etu = db.query(User).filter(User.id == etudiant_id).first()
    if not etu:
        raise HTTPException(status_code=404, detail="Etudiant introuvable")

    notes_q = (
        db.query(Note)
        .options(joinedload(Note.evaluation).joinedload(Evaluation.module))
        .filter(Note.etudiant_id == etudiant_id)
        .all()
    )
    from app.models import Absence as AbsenceModel
    absences_q = (
        db.query(AbsenceModel)
        .options(joinedload(AbsenceModel.module))
        .filter(AbsenceModel.etudiant_id == etudiant_id)
        .all()
    )
    alertes_q = (
        db.query(Alerte)
        .filter(Alerte.etudiant_id == etudiant_id)
        .order_by(Alerte.created_at.desc()).limit(20).all()
    )

    risk = predict_risk(extract_features(db, etudiant_id))

    return RecapEtudiant(
        etudiant=EtudiantInfo(id=etu.id, cne=etu.cne, full_name=etu.full_name, email=etu.email),
        notes=[_note_to_read(n) for n in notes_q],
        absences=[_absence_to_read(a) for a in absences_q],
        alertes=[
            AlerteRead(
                id=a.id, etudiant_id=a.etudiant_id, etudiant_nom=etu.full_name,
                type=a.type, urgence=a.urgence, titre=a.titre, message=a.message,
                lue=a.lue, score_risque=a.score_risque, created_at=a.created_at,
            ) for a in alertes_q
        ],
        score_risque=ScoreRisque(score=risk["score"], niveau=risk["niveau"], couleur=risk["couleur"]),
    )


@router.get("/etudiant/{etudiant_id}/recap", response_model=RecapEtudiant)
def recap_etudiant_by_id(
    etudiant_id: int,
    current: User = Depends(require_chef),
    db: Session = Depends(get_db),
):
    return _build_recap(db, etudiant_id)
