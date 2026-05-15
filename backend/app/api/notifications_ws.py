"""WebSocket real-time notifications for alerts."""
import asyncio
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Alerte, User, Promotion, Module, Inscription
from app.models.user import Role
from app.security import decode_access_token


router = APIRouter()


def _serialize_alert(alert: Alerte) -> dict[str, Any]:
    return {
        "id": alert.id,
        "etudiant_id": alert.etudiant_id,
        "etudiant_nom": alert.etudiant.full_name if alert.etudiant else None,
        "type": alert.type,
        "urgence": alert.urgence,
        "titre": alert.titre,
        "message": alert.message,
        "lue": alert.lue,
        "score_risque": alert.score_risque,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
    }


def _get_user_from_token(db: Session, token: str | None) -> User | None:
    if not token:
        return None

    payload = decode_access_token(token)

    if payload is None:
        return None

    user_id = payload.get("sub")

    if user_id is None:
        return None

    return (
        db.query(User)
        .filter(User.id == int(user_id), User.is_active == True)  # noqa: E712
        .first()
    )


def _alerts_query_for_user(db: Session, user: User):
    """Return scoped alerts query for the connected user."""

    q = db.query(Alerte).join(User, Alerte.etudiant_id == User.id)

    if user.role == Role.etudiant:
        q = q.filter(Alerte.etudiant_id == user.id)

    elif user.role == Role.chef_filiere and user.filiere_dirigee_id is not None:
        q = q.join(Promotion, User.promotion_id == Promotion.id).filter(
            Promotion.filiere_id == user.filiere_dirigee_id
        )

    elif user.role == Role.enseignant:
        q = (
            q.join(Inscription, Inscription.etudiant_id == User.id)
            .join(Module, Inscription.module_id == Module.id)
            .filter(Module.enseignant_id == user.id)
            .distinct()
        )

    elif user.role == Role.admin:
        q = q

    else:
        q = q.filter(False)

    return q


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """Push unread/new alerts to authenticated users.

    Auth is done using:
    ws://localhost:8001/ws/notifications?token=JWT
    """

    await websocket.accept()

    token = websocket.query_params.get("token")

    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)

        if not user:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": "Token invalide ou expire",
                }
            )
            await websocket.close(code=1008)
            return

        user_id = user.id
        user_role = user.role.value

        await websocket.send_json(
            {
                "type": "connected",
                "user_id": user_id,
                "role": user_role,
                "message": "Notifications temps réel connectées",
            }
        )

    finally:
        db.close()

    last_sent_id = 0
    last_unread_count = -1

    try:
        while True:
            db = SessionLocal()

            try:
                user = db.query(User).filter(User.id == user_id).first()

                if not user or not user.is_active:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Utilisateur inactif ou introuvable",
                        }
                    )
                    await websocket.close(code=1008)
                    return

                scoped_query = _alerts_query_for_user(db, user)

                unread_count = (
                    scoped_query.filter(Alerte.lue == False)  # noqa: E712
                    .count()
                )

                new_alerts = (
                    scoped_query.filter(Alerte.id > last_sent_id)
                    .order_by(Alerte.id.asc())
                    .limit(20)
                    .all()
                )

                if new_alerts:
                    last_sent_id = max(alert.id for alert in new_alerts)

                if new_alerts or unread_count != last_unread_count:
                    await websocket.send_json(
                        {
                            "type": "alerts",
                            "unread_count": unread_count,
                            "alerts": [_serialize_alert(alert) for alert in new_alerts],
                        }
                    )

                    last_unread_count = unread_count

            finally:
                db.close()

            await asyncio.sleep(5)

    except WebSocketDisconnect:
        return