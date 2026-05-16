"""
Validate IA risk scoring with representative student profiles.

This script is used to verify that the risk predictor returns coherent scores,
levels, colors, and source information.

Run:
    python -m app.ml.validate_risk
"""
from app.ml.features import FEATURE_NAMES
from app.ml.predictor import predict_risk


def make_features(
    taux_absence: float,
    moyenne_generale: float,
    nb_modules_sous_10: float,
    taux_notes_manquantes: float,
    evolution_notes: float,
    moyenne_min_module: float,
    ecart_moyenne: float,
) -> dict[str, float]:
    return {
        "taux_absence": taux_absence,
        "moyenne_generale": moyenne_generale,
        "nb_modules_sous_10": nb_modules_sous_10,
        "taux_notes_manquantes": taux_notes_manquantes,
        "evolution_notes": evolution_notes,
        "moyenne_min_module": moyenne_min_module,
        "ecart_moyenne": ecart_moyenne,
    }


def validate_feature_names() -> None:
    expected = {
        "taux_absence",
        "moyenne_generale",
        "nb_modules_sous_10",
        "taux_notes_manquantes",
        "evolution_notes",
        "moyenne_min_module",
        "ecart_moyenne",
    }

    actual = set(FEATURE_NAMES)

    missing = expected - actual
    extra = actual - expected

    if missing or extra:
        raise RuntimeError(
            f"FEATURE_NAMES mismatch. Missing={missing}, Extra={extra}"
        )


def run_validation() -> None:
    validate_feature_names()

    profiles = [
        {
            "label": "Profil stable",
            "features": make_features(
                taux_absence=3.0,
                moyenne_generale=14.5,
                nb_modules_sous_10=0,
                taux_notes_manquantes=0.0,
                evolution_notes=0.8,
                moyenne_min_module=12.5,
                ecart_moyenne=2.0,
            ),
        },
        {
            "label": "Profil à surveiller",
            "features": make_features(
                taux_absence=18.0,
                moyenne_generale=10.8,
                nb_modules_sous_10=2,
                taux_notes_manquantes=12.0,
                evolution_notes=-0.9,
                moyenne_min_module=8.5,
                ecart_moyenne=4.2,
            ),
        },
        {
            "label": "Profil critique",
            "features": make_features(
                taux_absence=42.0,
                moyenne_generale=7.4,
                nb_modules_sous_10=5,
                taux_notes_manquantes=35.0,
                evolution_notes=-2.8,
                moyenne_min_module=4.5,
                ecart_moyenne=6.5,
            ),
        },
    ]

    print("Validation IA - Détection des profils à risque")
    print("=" * 60)

    for profile in profiles:
        result = predict_risk(profile["features"])

        print(f"\n{profile['label']}")
        print("-" * 60)
        print(f"Score  : {result['score']}/100")
        print(f"Niveau : {result['niveau']}")
        print(f"Couleur: {result['couleur']}")
        print(f"Source : {result['source']}")

        for name in FEATURE_NAMES:
            print(f"  {name:<25} {profile['features'][name]}")

    print("\nValidation terminée avec succès.")


if __name__ == "__main__":
    run_validation()