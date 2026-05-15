"""
Feature extraction for the risk-of-failure classifier.

Features per student (cahier des charges section 6.3):
  - taux_absence_global
  - moyenne_generale
  - nombre_modules_sous_10
  - taux_notes_manquantes
  - evolution_notes (slope of recent grades)
  - moyenne_min_module
  - ecart_moyenne
"""
from typing import Dict, List, Optional
import numpy as np
from sqlalchemy.orm import Session

from app.models import Note, Evaluation, Module, User
from app.services import stats_service


FEATURE_NAMES = [
    "taux_absence",
    "moyenne_generale",
    "nb_modules_sous_10",
    "taux_notes_manquantes",
    "evolution_notes",
    "moyenne_min_module",
    "ecart_moyenne",
]


def extract_features(db: Session, etudiant_id: int) -> Dict[str, float]:
    student = db.query(User).filter(User.id == etudiant_id).first()
    if not student:
        return {k: 0.0 for k in FEATURE_NAMES}

    taux_absence = stats_service.compute_absence_rate(db, etudiant_id)
    moyenne_generale = stats_service.compute_general_average(db, etudiant_id) or 0.0

    # Per-module averages
    modules = (
        db.query(Module).filter(Module.promotion_id == student.promotion_id).all()
        if student.promotion_id else []
    )
    module_avgs: List[float] = []
    for m in modules:
        a = stats_service.compute_module_average(db, etudiant_id, m.id)
        if a is not None:
            module_avgs.append(a)

    nb_modules_sous_10 = sum(1 for a in module_avgs if a < 10)
    moyenne_min_module = min(module_avgs) if module_avgs else 0.0
    ecart_moyenne = (max(module_avgs) - min(module_avgs)) if len(module_avgs) > 1 else 0.0

    # Missing grades ratio
    total_evals = (
        db.query(Evaluation)
        .join(Module, Evaluation.module_id == Module.id)
        .filter(Module.promotion_id == student.promotion_id)
        .count()
    ) if student.promotion_id else 0
    n_notes = db.query(Note).filter(Note.etudiant_id == etudiant_id, Note.valeur.isnot(None)).count()
    taux_notes_manquantes = (
        100.0 * (total_evals - n_notes) / total_evals if total_evals > 0 else 0.0
    )

    # Evolution: slope of recent grades (most recent N=5), normalized
    recent_notes = (
        db.query(Note.valeur, Evaluation.bareme_max, Evaluation.date)
        .join(Evaluation, Note.evaluation_id == Evaluation.id)
        .filter(Note.etudiant_id == etudiant_id, Note.valeur.isnot(None), Evaluation.date.isnot(None))
        .order_by(Evaluation.date.desc())
        .limit(5)
        .all()
    )
    if len(recent_notes) >= 2:
        ys = [(v / b) * 20 for v, b, _ in reversed(recent_notes)]  # chronological
        xs = list(range(len(ys)))
        # Simple least-squares slope
        n = len(ys)
        mean_x = sum(xs) / n
        mean_y = sum(ys) / n
        num = sum((xs[i] - mean_x) * (ys[i] - mean_y) for i in range(n))
        den = sum((x - mean_x) ** 2 for x in xs) or 1e-9
        evolution_notes = num / den
    else:
        evolution_notes = 0.0

    return {
        "taux_absence": float(taux_absence),
        "moyenne_generale": float(moyenne_generale),
        "nb_modules_sous_10": float(nb_modules_sous_10),
        "taux_notes_manquantes": float(taux_notes_manquantes),
        "evolution_notes": float(evolution_notes),
        "moyenne_min_module": float(moyenne_min_module),
        "ecart_moyenne": float(ecart_moyenne),
    }


def features_to_vector(features: Dict[str, float]) -> np.ndarray:
    return np.array([features[name] for name in FEATURE_NAMES], dtype=np.float64).reshape(1, -1)
