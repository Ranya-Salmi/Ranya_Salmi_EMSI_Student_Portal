"""
Statistical computations: weighted averages per module/general, absence rates,
grade distributions. Pure functions taking a SQLAlchemy session.
"""
from typing import Optional, Dict, List
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Note, Absence, Module, Evaluation, Inscription, User
from app.models.user import Role


# -------------------------- Averages -----------------------------------------

def compute_module_average(db: Session, etudiant_id: int, module_id: int) -> Optional[float]:
    """Weighted average for one student in one module: sum(note * coeff) / sum(coeff)."""
    rows = (
        db.query(Note.valeur, Evaluation.coefficient, Evaluation.bareme_max)
        .join(Evaluation, Note.evaluation_id == Evaluation.id)
        .filter(
            Note.etudiant_id == etudiant_id,
            Evaluation.module_id == module_id,
            Note.valeur.isnot(None),
        )
        .all()
    )
    if not rows:
        return None

    total_w = sum(coeff for _, coeff, _ in rows)
    if total_w == 0:
        return None

    # Normalize to /20 in case some evaluations use a different bareme
    weighted = sum((valeur / bareme) * 20 * coeff for valeur, coeff, bareme in rows)
    return round(weighted / total_w, 2)


def compute_general_average(db: Session, etudiant_id: int) -> Optional[float]:
    """Weighted average across all modules using module coefficients."""
    student = db.query(User).filter(User.id == etudiant_id).first()
    if not student or not student.promotion_id:
        return None

    modules = db.query(Module).filter(Module.promotion_id == student.promotion_id).all()
    total_w = 0.0
    weighted_sum = 0.0
    for m in modules:
        avg = compute_module_average(db, etudiant_id, m.id)
        if avg is None:
            continue
        weighted_sum += avg * m.coefficient
        total_w += m.coefficient

    if total_w == 0:
        return None
    return round(weighted_sum / total_w, 2)


# -------------------------- Absence ------------------------------------------

def compute_absence_rate(db: Session, etudiant_id: int, module_id: Optional[int] = None) -> float:
    """
    Absence rate as percentage: hours absent / hours scheduled.
    We approximate "hours scheduled" using a fixed cadence (24 sessions of 2h
    per module per semester) since we don't model the full timetable.
    """
    SESSIONS_PER_MODULE = 24
    HOURS_PER_SESSION = 2

    q = db.query(func.coalesce(func.sum(Absence.duree_heures), 0)).filter(Absence.etudiant_id == etudiant_id)
    if module_id is not None:
        q = q.filter(Absence.module_id == module_id)
    hours_absent = q.scalar() or 0

    if module_id is not None:
        total_hours = SESSIONS_PER_MODULE * HOURS_PER_SESSION
    else:
        # All modules of the student's promotion
        student = db.query(User).filter(User.id == etudiant_id).first()
        if not student or not student.promotion_id:
            return 0.0
        n_modules = db.query(Module).filter(Module.promotion_id == student.promotion_id).count()
        total_hours = SESSIONS_PER_MODULE * HOURS_PER_SESSION * max(n_modules, 1)

    if total_hours == 0:
        return 0.0
    return round(100.0 * hours_absent / total_hours, 2)


# -------------------------- Distributions ------------------------------------

def grade_distribution(grades: List[float]) -> Dict[str, int]:
    bins = {"0-5": 0, "5-10": 0, "10-12": 0, "12-14": 0, "14-16": 0, "16-20": 0}
    for g in grades:
        if g < 5:
            bins["0-5"] += 1
        elif g < 10:
            bins["5-10"] += 1
        elif g < 12:
            bins["10-12"] += 1
        elif g < 14:
            bins["12-14"] += 1
        elif g < 16:
            bins["14-16"] += 1
        else:
            bins["16-20"] += 1
    return bins


def compute_module_stats(db: Session, module_id: int) -> dict:
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return {}

    # Get all enrolled students' averages for this module
    inscriptions = db.query(Inscription).filter(Inscription.module_id == module_id, Inscription.active == True).all()  # noqa: E712
    averages = []
    for ins in inscriptions:
        avg = compute_module_average(db, ins.etudiant_id, module_id)
        if avg is not None:
            averages.append(avg)

    if not averages:
        return {
            "module_id": module_id,
            "module_nom": module.nom,
            "moyenne_classe": 0.0,
            "taux_reussite": 0.0,
            "ecart_type": 0.0,
            "distribution": grade_distribution([]),
        }

    moyenne = sum(averages) / len(averages)
    reussite = 100.0 * sum(1 for a in averages if a >= 10) / len(averages)
    sigma = statistics.stdev(averages) if len(averages) > 1 else 0.0

    return {
        "module_id": module_id,
        "module_nom": module.nom,
        "moyenne_classe": round(moyenne, 2),
        "taux_reussite": round(reussite, 2),
        "ecart_type": round(sigma, 2),
        "distribution": grade_distribution(averages),
    }
