"""
Pytest fixtures: in-memory SQLite database with all tables created,
plus a TestClient that overrides the get_db dependency.
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.security import hash_password
from app.models import User, Role, Filiere, Promotion, Module, Evaluation, Inscription


# Single engine shared across the in-memory DB
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    # Don't trigger lifespan (which would run seed against the wrong engine)
    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_db(db_session):
    """Minimal seed: 1 admin, 1 chef, 1 enseignant, 1 etudiant, 1 module, 1 eval."""
    filiere = Filiere(nom="IIR", code="IIR")
    db_session.add(filiere); db_session.flush()
    promo = Promotion(nom="3IIR-G2", annee="2025/2026", filiere_id=filiere.id)
    db_session.add(promo); db_session.flush()

    admin = User(email="admin@test.ma", password_hash=hash_password("admin123"),
                 first_name="A", last_name="DMIN", role=Role.admin, is_active=True)
    chef = User(email="chef@test.ma", password_hash=hash_password("chef123"),
                first_name="C", last_name="HEF", role=Role.chef_filiere, is_active=True,
                filiere_dirigee_id=filiere.id)
    prof = User(email="prof@test.ma", password_hash=hash_password("prof123"),
                first_name="P", last_name="ROF", role=Role.enseignant, is_active=True)
    db_session.add_all([admin, chef, prof]); db_session.flush()

    etu = User(email="etu@test.ma", password_hash=hash_password("etu123"),
               first_name="E", last_name="TU", role=Role.etudiant, is_active=True,
               cne="E000", promotion_id=promo.id)
    db_session.add(etu); db_session.flush()

    module = Module(nom="Test Module", code="TST", coefficient=2.0, semestre=2,
                    promotion_id=promo.id, enseignant_id=prof.id)
    db_session.add(module); db_session.flush()

    evaluation = Evaluation(nom="Controle 1", type="devoir", coefficient=1.0,
                            bareme_max=20.0, module_id=module.id)
    db_session.add(evaluation); db_session.flush()

    db_session.add(Inscription(etudiant_id=etu.id, module_id=module.id, active=True))
    db_session.commit()

    return {
        "admin": admin, "chef": chef, "prof": prof, "etu": etu,
        "filiere": filiere, "promotion": promo, "module": module, "evaluation": evaluation,
    }


def login_as(client, email: str, password: str) -> str:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]
