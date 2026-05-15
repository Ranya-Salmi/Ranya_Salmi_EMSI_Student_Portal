"""
Alert generation service.
Two sources:
  1. Threshold-based: high absence rate, low average grade.
  2. IA-based: risk score from the Random Forest classifier.
"""
from typing import List
from sqlalchemy.orm import Session

from app.models import Alerte, User, Absence, Note, Module, Inscription, Evaluation
from app.config import settings
from app.services import stats_service


def generate_threshold_alerts_for_student(db: Session, etudiant: User) -> List[Alerte]:
    """Check thresholds for one student and create alerts if breached."""
    created: List[Alerte] = []

    # Absence threshold (overall)
    taux = stats_service.compute_absence_rate(db, etudiant.id)
    if taux >= settings.seuil_absence_alerte:
        # Avoid duplicates: only create if no recent unread absence alert
        existing = (
            db.query(Alerte)
            .filter(
                Alerte.etudiant_id == etudiant.id,
                Alerte.type == "absence",
                Alerte.lue == False,  # noqa: E712
            )
            .first()
        )
        if not existing:
            urgence = "critical" if taux >= settings.seuil_absence_alerte + 10 else "warning"
            alerte = Alerte(
                etudiant_id=etudiant.id,
                type="absence",
                urgence=urgence,
                titre="Seuil d'absence atteint",
                message=f"Votre taux d'absence global est de {taux:.1f}%, au-dessus du seuil de {settings.seuil_absence_alerte}%.",
            )
            db.add(alerte)
            created.append(alerte)

    # Grade threshold (overall)
    moyenne = stats_service.compute_general_average(db, etudiant.id)
    if moyenne is not None and moyenne < settings.seuil_note_alerte:
        existing = (
            db.query(Alerte)
            .filter(
                Alerte.etudiant_id == etudiant.id,
                Alerte.type == "note",
                Alerte.lue == False,  # noqa: E712
            )
            .first()
        )
        if not existing:
            alerte = Alerte(
                etudiant_id=etudiant.id,
                type="note",
                urgence="warning",
                titre="Moyenne en dessous du seuil",
                message=f"Votre moyenne generale ({moyenne:.2f}/20) est inferieure au seuil de {settings.seuil_note_alerte}/20.",
            )
            db.add(alerte)
            created.append(alerte)

    return created
