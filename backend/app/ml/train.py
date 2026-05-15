"""
Random Forest classifier for student-at-risk-of-failure detection.

Trains on a training dataset representing realistic student profiles, then
persists the trained model to disk for use by the prediction service.

Run as a script:
    python -m app.ml.train

The training dataset is constructed using rules informed by the domain:
  - High absence rate -> higher risk
  - Low general average -> higher risk
  - Many modules below 10 -> higher risk
  - Many missing grades -> moderate risk
  - Strongly negative grade trajectory -> moderate risk
We label profiles in three classes (0 = faible, 1 = modere, 2 = eleve) based
on a weighted score plus noise, then the classifier learns to recover the
underlying mapping.
"""
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix


# Keep this list in sync with app.ml.features.FEATURE_NAMES.
# Duplicated here so the training script has no DB dependency.
FEATURE_NAMES = [
    "taux_absence",
    "moyenne_generale",
    "nb_modules_sous_10",
    "taux_notes_manquantes",
    "evolution_notes",
    "moyenne_min_module",
    "ecart_moyenne",
]


MODEL_PATH = Path(__file__).parent / "risk_model.pkl"
RNG = np.random.default_rng(42)


def generate_training_dataset(n: int = 3000):
    """Generate (X, y) where each row is a training student profile."""
    # Independent feature distributions
    taux_absence = RNG.beta(2, 5, n) * 60  # 0-60%, skewed low
    moyenne_generale = np.clip(RNG.normal(12, 3, n), 0, 20)
    nb_modules_sous_10 = RNG.poisson(0.8, n).clip(0, 8)
    taux_notes_manquantes = RNG.beta(2, 8, n) * 100
    evolution_notes = RNG.normal(0, 1.5, n)
    moyenne_min_module = np.clip(moyenne_generale - RNG.uniform(0, 5, n), 0, 20)
    ecart_moyenne = RNG.uniform(0, 8, n)

    # Underlying risk score (the "ground truth" the model will learn)
    risk = (
        1.6 * (taux_absence / 30)
        + 1.8 * np.maximum(0, (10 - moyenne_generale) / 5)
        + 0.9 * nb_modules_sous_10
        + 0.5 * (taux_notes_manquantes / 50)
        + 0.8 * np.maximum(0, -evolution_notes)
        + 0.4 * np.maximum(0, (10 - moyenne_min_module) / 5)
        + RNG.normal(0, 0.4, n)
    )

    # Map score to three classes: faible (0), modere (1), eleve (2)
    y = np.zeros(n, dtype=int)
    y[risk > 2.0] = 1
    y[risk > 4.0] = 2

    X = np.column_stack([
        taux_absence,
        moyenne_generale,
        nb_modules_sous_10,
        taux_notes_manquantes,
        evolution_notes,
        moyenne_min_module,
        ecart_moyenne,
    ])
    return X, y


def train_and_save() -> RandomForestClassifier:
    X, y = generate_training_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("Class distribution (train):", np.bincount(y_train))
    print("Class distribution (test):", np.bincount(y_test))
    print("\nClassification report on test set:")
    print(classification_report(y_test, y_pred, target_names=["faible", "modere", "eleve"]))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, y_pred))

    importances = sorted(zip(FEATURE_NAMES, clf.feature_importances_), key=lambda x: -x[1])
    print("\nFeature importances:")
    for name, imp in importances:
        print(f"  {name:<25} {imp:.4f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    return clf


if __name__ == "__main__":
    train_and_save()


