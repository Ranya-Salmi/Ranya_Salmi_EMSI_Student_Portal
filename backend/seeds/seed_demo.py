"""
Seed the database with initial data for the PFA presentation.

Creates:
  - 1 filiere (3IIR) + 1 promotion (3IIR-G2 2025/2026)
  - 4 initial users used by the frontend authentication flow (admin / chef / enseignant / etudiant)
  - 5 modules + several evaluations
  - 25 fictional students with varied profiles (some at risk)
  - Notes and absences distributed to produce realistic risk scores
  - A few unread alerts
"""
from datetime import date, timedelta
import random
from sqlalchemy.orm import Session

from app.models import (
    User, Role, Filiere, Promotion, Module, Evaluation, Inscription,
    Note, Absence, Alerte,
)
from app.security import hash_password


# Fictional student profiles. The "profil" key drives how grades and absences are generated.
initial_STUDENTS = [
    ("Youssef", "ALAMI", "E123456789", "at_risk"),
    ("Sara", "IDRISSI", "E987654321", "average"),
    ("Imane", "BENNANI", "E456789123", "at_risk"),
    ("Omar", "ZIANI", "E321654987", "average"),
    ("Leila", "FASSI", "E789123456", "strong"),
    ("Anas", "BERRADA", "E111222333", "strong"),
    ("Nada", "CHRAIBI", "E444555666", "average"),
    ("Mehdi", "EL FASSI", "E777888999", "at_risk"),
    ("Salma", "BOUKHRIS", "E101010101", "strong"),
    ("Reda", "KETTANI", "E202020202", "average"),
    ("Aya", "HASSANI", "E303030303", "strong"),
    ("Ilyas", "BENJELLOUN", "E404040404", "average"),
    ("Khadija", "TAZI", "E505050505", "at_risk"),
    ("Hamza", "AMRANI", "E606060606", "average"),
    ("Lina", "BENNIS", "E707070707", "strong"),
    ("Adam", "RAHMOUNI", "E808080808", "average"),
    ("Hiba", "EL KHALFI", "E909090909", "strong"),
    ("Karim", "SQALLI", "E111213141", "at_risk"),
    ("Soukaina", "DRISSI", "E151617181", "average"),
    ("Yassir", "SEFRIOUI", "E192021222", "strong"),
    ("Fatima", "OUAZZANI", "E232425262", "average"),
    ("Othmane", "BOUAZIZ", "E272829303", "average"),
    ("Meryem", "AIT BENALI", "E313233343", "strong"),
    ("Walid", "GHALI", "E353637383", "at_risk"),
    ("Asma", "FILALI", "E394041424", "average"),
]


def seed_all(db: Session) -> None:
    random.seed(42)

    # ---------- Filiere & promotion ----------
    filiere = Filiere(
        nom="Ingenierie Informatique et Reseaux",
        code="IIR",
        description="Filiere 3eme annee ingenieur en informatique et reseaux",
    )
    db.add(filiere); db.flush()

    promotion = Promotion(nom="3IIR-G2", annee="2025/2026", filiere_id=filiere.id)
    db.add(promotion); db.flush()

    # ---------- Admin user ----------
    admin = User(
        email="admin@emsi.ma",
        password_hash=hash_password("admin2026"),
        first_name="Admin", last_name="EMSI",
        role=Role.admin, is_active=True,
    )
    db.add(admin)

    # ---------- Chef de filiere ----------
    chef = User(
        email="chef.iir@emsi.ma",
        password_hash=hash_password("chef2026"),
        first_name="Mohammed", last_name="BENALI",
        role=Role.chef_filiere, is_active=True,
        filiere_dirigee_id=filiere.id,
    )
    db.add(chef)

    # ---------- Enseignants ----------
    prof_analyse = User(
        email="prof.analyse@emsi.ma",
        password_hash=hash_password("prof2026"),
        first_name="Fatima", last_name="ZAHRA",
        role=Role.enseignant, is_active=True,
    )
    prof_math = User(
        email="prof.math@emsi.ma",
        password_hash=hash_password("prof2026"),
        first_name="Ahmed", last_name="TAZI",
        role=Role.enseignant, is_active=True,
    )
    prof_bdd = User(
        email="prof.bdd@emsi.ma",
        password_hash=hash_password("prof2026"),
        first_name="Rachid", last_name="HAMDANI",
        role=Role.enseignant, is_active=True,
    )
    db.add_all([prof_analyse, prof_math, prof_bdd])
    db.flush()

    # ---------- Modules (semestre 2) ----------
    modules_specs = [
        ("Analyse Numerique", "ANA-S2", 3.0, prof_analyse.id),
        ("Bases de Donnees Avancees", "BDD-S2", 4.0, prof_bdd.id),
        ("Programmation Web", "PWEB-S2", 3.0, prof_analyse.id),
        ("Mathematiques Appliquees", "MATH-S2", 2.0, prof_math.id),
        ("Reseaux Informatiques", "RES-S2", 3.0, prof_math.id),
    ]
    modules = []
    for nom, code, coeff, prof_id in modules_specs:
        m = Module(
            nom=nom, code=code, coefficient=coeff, semestre=2,
            promotion_id=promotion.id, enseignant_id=prof_id,
        )
        db.add(m); modules.append(m)
    db.flush()

    # ---------- Evaluations per module ----------
    today = date.today()
    evaluations: list[Evaluation] = []
    for m in modules:
        ev1 = Evaluation(nom="Controle 1", type="devoir", coefficient=1.0, bareme_max=20.0,
                         date=today - timedelta(days=60), module_id=m.id)
        ev2 = Evaluation(nom="Controle 2", type="devoir", coefficient=1.0, bareme_max=20.0,
                         date=today - timedelta(days=30), module_id=m.id)
        ev3 = Evaluation(nom="Examen final", type="examen", coefficient=2.0, bareme_max=20.0,
                         date=today - timedelta(days=7), module_id=m.id)
        db.add_all([ev1, ev2, ev3])
        evaluations.extend([ev1, ev2, ev3])
    db.flush()

    # ---------- Etudiants ----------
    etudiants: list[tuple[User, str]] = []
    for i, (prenom, nom, cne, profil) in enumerate(initial_STUDENTS, start=1):
        login_email = f"etudiant{i}@emsi.ma" if i > 1 else "etudiant1@emsi.ma"
        password = "etu2026"
        etu = User(
            email=login_email,
            password_hash=hash_password(password),
            first_name=prenom, last_name=nom,
            role=Role.etudiant, is_active=True,
            cne=cne, promotion_id=promotion.id,
        )
        db.add(etu); db.flush()
        etudiants.append((etu, profil))

        # Enroll in all modules
        for m in modules:
            db.add(Inscription(etudiant_id=etu.id, module_id=m.id, active=True))

    db.flush()

    # ---------- Notes per profile ----------
    def gen_grade(profile: str) -> float:
        if profile == "strong":
            return round(random.uniform(13, 18), 2)
        if profile == "average":
            return round(random.uniform(9, 14), 2)
        # at_risk
        return round(random.uniform(4, 11), 2)

    for etu, profil in etudiants:
        for ev in evaluations:
            # ~10% missing grades for at-risk students, ~3% otherwise
            miss_proba = 0.10 if profil == "at_risk" else 0.03
            valeur = None if random.random() < miss_proba else gen_grade(profil)
            db.add(Note(
                etudiant_id=etu.id, evaluation_id=ev.id, valeur=valeur,
                saisie_par=ev.module.enseignant_id, statut="validee",
            ))

    # ---------- Absences per profile ----------
    def gen_n_absences(profile: str) -> int:
        if profile == "strong":
            return random.randint(0, 2)
        if profile == "average":
            return random.randint(2, 5)
        return random.randint(6, 14)

    for etu, profil in etudiants:
        n = gen_n_absences(profil)
        for _ in range(n):
            m = random.choice(modules)
            days_back = random.randint(1, 90)
            justifiee = random.random() < 0.3
            db.add(Absence(
                etudiant_id=etu.id, module_id=m.id,
                date_cours=today - timedelta(days=days_back),
                duree_heures=2, justifiee=justifiee,
                statut="justifiee" if justifiee else "non_justifiee",
                motif_justification="Certificat medical" if justifiee else None,
                saisie_par=m.enseignant_id,
            ))

    db.flush()

    # ---------- A few unread alerts to make the dashboard lively ----------
    for etu, profil in etudiants:
        if profil != "at_risk":
            continue
        db.add(Alerte(
            etudiant_id=etu.id,
            type="absence",
            urgence="critical",
            titre="Seuil d'absence atteint",
            message=f"Votre taux d'absence depasse le seuil reglementaire. Contactez votre chef de filiere.",
            lue=False,
        ))

    db.commit()
    print(f"Seed termine : {len(etudiants)} etudiants, {len(modules)} modules, {len(evaluations)} evaluations.")


if __name__ == "__main__":
    from app.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed_all(db)
        else:
            print("Base deja peuplee.")
    finally:
        db.close()


