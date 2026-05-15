"""
Inference wrapper for the risk classifier.
Loads the model lazily (singleton) and exposes predict_score(student_features).
If the model file doesn't exist, falls back to a rules-based score so the
API still works during development.
"""
from pathlib import Path
from typing import Dict, Optional
import logging
import joblib

from app.ml.features import FEATURE_NAMES, features_to_vector

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).parent / "risk_model.pkl"
_model = None  # lazy-loaded


def _load_model():
    global _model
    if _model is not None:
        return _model
    if _MODEL_PATH.exists():
        try:
            _model = joblib.load(_MODEL_PATH)
            logger.info("Risk model loaded from %s", _MODEL_PATH)
        except Exception as e:  # pragma: no cover
            logger.exception("Failed to load risk model: %s", e)
            _model = None
    else:
        logger.warning("Risk model not found at %s — using fallback rules", _MODEL_PATH)
        _model = None
    return _model


def _fallback_score(features: Dict[str, float]) -> int:
    """Deterministic rules-based fallback when the ML model isn't trained yet."""
    score = 0.0
    score += min(features["taux_absence"], 60) * 1.0
    score += max(0, 10 - features["moyenne_generale"]) * 5
    score += features["nb_modules_sous_10"] * 6
    score += features["taux_notes_manquantes"] * 0.2
    score += max(0, -features["evolution_notes"]) * 5
    return int(min(100, max(0, score)))


def score_to_level(score: int) -> tuple[str, str]:
    """Map a 0–100 score to (niveau, couleur)."""
    if score >= 71:
        return "eleve", "red"
    if score >= 41:
        return "modere", "orange"
    return "faible", "green"


def predict_risk(features: Dict[str, float]) -> dict:
    """Return {score, niveau, couleur, source} for a student feature vector."""
    model = _load_model()
    if model is None:
        score = _fallback_score(features)
        source = "fallback_rules"
    else:
        X = features_to_vector(features)
        # Class probabilities -> weighted risk score in [0, 100]
        # Classes: 0 = faible, 1 = modere, 2 = eleve
        probas = model.predict_proba(X)[0]
        # Map class indices to score anchors: 20, 55, 85
        anchors = [20, 55, 85]
        # Pad in case model has fewer than 3 classes (degenerate training)
        while len(probas) < 3:
            probas = list(probas) + [0.0]
        score = int(round(sum(p * a for p, a in zip(probas, anchors))))
        score = max(0, min(100, score))
        source = "random_forest"

    niveau, couleur = score_to_level(score)
    return {"score": score, "niveau": niveau, "couleur": couleur, "source": source}
