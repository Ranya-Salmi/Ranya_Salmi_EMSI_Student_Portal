"""Auth endpoint tests."""
from tests.conftest import login_as


def test_login_success(client, seeded_db):
    resp = client.post("/auth/login", json={"email": "admin@test.ma", "password": "admin123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == "admin"
    assert "access_token" in body
    assert body["full_name"] == "A DMIN"


def test_login_wrong_password(client, seeded_db):
    resp = client.post("/auth/login", json={"email": "admin@test.ma", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_email(client, seeded_db):
    resp = client.post("/auth/login", json={"email": "nope@test.ma", "password": "x"})
    assert resp.status_code == 401


def test_me_requires_token(client, seeded_db):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client, seeded_db):
    token = login_as(client, "etu@test.ma", "etu123")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "etudiant"
