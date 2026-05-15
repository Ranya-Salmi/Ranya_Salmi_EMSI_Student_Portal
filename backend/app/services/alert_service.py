"""
Alert generation service.

Sources:
1. Threshold-based alerts:
   - high absence rate
   - low general average

2. IA-based alerts:
   - risk score computed from ML/fallback predictor
   - features: absences, averages, modules < 10, missing notes, grade evolution
"""
from typing import List

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Alerte, User
from app.models.user import Role
from app.services import stats_service
from app.ml.features import extract_features
from app.ml.predictor import predict_risk


def _has_unread_alert(db: Session, etudiant_id: int, alert_type: str) -> bool:
    return (
        db.query(Alerte)
        .filter(
            Alerte.etudiant_id == etudiant_id,
            Alerte.type == alert_type,
            Alerte.lue == False,  # noqa: E712
        )
        .first()
        is not None
    )


def generate_threshold_alerts_for_student(db: Session, etudiant: User) -> List[Alerte]:
    """Create threshold and IA-risk alerts for one student.

    This function is called after note/absence updates.
    It keeps the old function name to avoid changing notes.py and absences.py.
    """
    created: List[Alerte] = []

    if etudiant.role != Role.etudiant:
        return created

    # ---------------- Absence threshold alert ----------------

    taux = stats_service.compute_absence_rate(db, etudiant.id)

    if taux >= settings.seuil_absence_alerte:
        if not _has_unread_alert(db, etudiant.id, "absence"):
            urgence = (
                "critical"
                if taux >= settings.seuil_absence_alerte + 10
                else "warning"
            )

            alerte = Alerte(
                etudiant_id=etudiant.id,
                type="absence",
                urgence=urgence,
                titre="Seuil d'absence atteint",
                message=(
                    f"Votre taux d'absence global est de {taux:.1f}%, "
                    f"au-dessus du seuil de {settings.seuil_absence_alerte}%."
                ),
            )

            db.add(alerte)
            created.append(alerte)

    # ---------------- Grade threshold alert ----------------

    moyenne = stats_service.compute_general_average(db, etudiant.id)

    if moyenne is not None and moyenne < settings.seuil_note_alerte:
        if not _has_unread_alert(db, etudiant.id, "note"):
            alerte = Alerte(
                etudiant_id=etudiant.id,
                type="note",
                urgence="warning",
                titre="Moyenne en dessous du seuil",
                message=(
                    f"Votre moyenne générale ({moyenne:.2f}/20) est "
                    f"inférieure au seuil de {settings.seuil_note_alerte}/20."
                ),
            )

            db.add(alerte)
            created.append(alerte)

    # ---------------- IA risk alert ----------------

    features = extract_features(db, etudiant.id)
    risk = predict_risk(features)

    score = int(risk["score"])
    niveau = str(risk["niveau"])
    source = str(risk.get("source", "unknown"))

    if score >= 41:
        if not _has_unread_alert(db, etudiant.id, "risque_ia"):
            urgence = "critical" if score >= 71 else "warning"

            alerte = Alerte(
                etudiant_id=etudiant.id,
                type="risque_ia",
                urgence=urgence,
                titre=(
                    "Profil à risque élevé détecté"
                    if score >= 71
                    else "Profil à risque modéré détecté"
                ),
                message=(
                    f"Le score de risque IA de l'étudiant est de {score}/100 "
                    f"({niveau}). Source du calcul : {source}. "
                    f"Facteurs principaux : absence {features['taux_absence']:.1f}%, "
                    f"moyenne {features['moyenne_generale']:.2f}/20, "
                    f"modules sous 10 : {int(features['nb_modules_sous_10'])}, "
                    f"notes manquantes : {features['taux_notes_manquantes']:.1f}%."
                ),
                score_risque=score,
            )

            db.add(alerte)
            created.append(alerte)

    return created