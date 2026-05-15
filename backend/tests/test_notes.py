"""Notes endpoint tests, including audit logging and RBAC."""
from tests.conftest import login_as
from app.models import AuditLog, Note


def test_enseignant_can_create_note(client, seeded_db, db_session):
    token = login_as(client, "prof@test.ma", "prof123")
    resp = client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 15.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["valeur"] == 15.5
    assert body["module_nom"] == "Test Module"


def test_note_creation_writes_audit_log(client, seeded_db, db_session):
    token = login_as(client, "prof@test.ma", "prof123")
    client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 12},
        headers={"Authorization": f"Bearer {token}"},
    )
    logs = db_session.query(AuditLog).filter(AuditLog.table_name == "notes").all()
    assert len(logs) >= 1
    assert logs[0].action == "create"
    assert logs[0].nouvelle_valeur["valeur"] == 12


def test_note_modification_preserves_old_value(client, seeded_db, db_session):
    token = login_as(client, "prof@test.ma", "prof123")
    # create
    r1 = client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 10},
        headers={"Authorization": f"Bearer {token}"},
    )
    note_id = r1.json()["id"]
    # update
    client.patch(
        f"/notes/{note_id}",
        json={"valeur": 14, "raison_modification": "Correction"},
        headers={"Authorization": f"Bearer {token}"},
    )
    update_logs = (
        db_session.query(AuditLog)
        .filter(AuditLog.table_name == "notes", AuditLog.action == "update")
        .all()
    )
    assert len(update_logs) == 1
    assert update_logs[0].ancienne_valeur["valeur"] == 10
    assert update_logs[0].nouvelle_valeur["valeur"] == 14
    assert update_logs[0].raison_modification == "Correction"


def test_etudiant_cannot_create_note(client, seeded_db):
    token = login_as(client, "etu@test.ma", "etu123")
    resp = client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 18},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_etudiant_sees_only_own_notes(client, seeded_db, db_session):
    # Prof first creates a note for the seeded etudiant
    tok_prof = login_as(client, "prof@test.ma", "prof123")
    client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 13},
        headers={"Authorization": f"Bearer {tok_prof}"},
    )

    tok_etu = login_as(client, "etu@test.ma", "etu123")
    # Can read own notes
    r1 = client.get(f"/notes/etudiant/{seeded_db['etu'].id}", headers={"Authorization": f"Bearer {tok_etu}"})
    assert r1.status_code == 200
    # Cannot read someone else's notes (use a fake id)
    r2 = client.get(f"/notes/etudiant/{seeded_db['etu'].id + 999}", headers={"Authorization": f"Bearer {tok_etu}"})
    assert r2.status_code == 403


def test_note_out_of_range_rejected(client, seeded_db):
    token = login_as(client, "prof@test.ma", "prof123")
    resp = client.post(
        "/notes",
        json={"etudiant_id": seeded_db["etu"].id, "evaluation_id": seeded_db["evaluation"].id, "valeur": 25},
        headers={"Authorization": f"Bearer {token}"},
    )
    # Pydantic catches this with 422
    assert resp.status_code == 422
