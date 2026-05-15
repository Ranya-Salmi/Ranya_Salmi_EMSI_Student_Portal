"""Tests for the IA risk prediction module."""
from app.ml.predictor import predict_risk, score_to_level
from app.ml.features import FEATURE_NAMES


def test_score_to_level_thresholds():
    assert score_to_level(10) == ("faible", "green")
    assert score_to_level(40) == ("faible", "green")
    assert score_to_level(41) == ("modere", "orange")
    assert score_to_level(70) == ("modere", "orange")
    assert score_to_level(71) == ("eleve", "red")
    assert score_to_level(100) == ("eleve", "red")


def test_predict_risk_low():
    features = {
        "taux_absence": 2.0,
        "moyenne_generale": 16.0,
        "nb_modules_sous_10": 0,
        "taux_notes_manquantes": 0.0,
        "evolution_notes": 0.5,
        "moyenne_min_module": 14.0,
        "ecart_moyenne": 2.0,
    }
    result = predict_risk(features)
    assert "score" in result
    assert result["niveau"] == "faible"
    assert result["couleur"] == "green"


def test_predict_risk_high():
    features = {
        "taux_absence": 45.0,
        "moyenne_generale": 6.0,
        "nb_modules_sous_10": 4,
        "taux_notes_manquantes": 40.0,
        "evolution_notes": -2.0,
        "moyenne_min_module": 3.0,
        "ecart_moyenne": 6.0,
    }
    result = predict_risk(features)
    assert result["niveau"] in ("modere", "eleve")
    # With these inputs, definitely not "faible"
    assert result["couleur"] in ("orange", "red")


def test_feature_names_order():
    # Stability: if this list changes, the trained model must be retrained
    assert FEATURE_NAMES == [
        "taux_absence",
        "moyenne_generale",
        "nb_modules_sous_10",
        "taux_notes_manquantes",
        "evolution_notes",
        "moyenne_min_module",
        "ecart_moyenne",
    ]
