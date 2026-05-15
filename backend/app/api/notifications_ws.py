"""WebSocket real-time notifications for alerts."""
import asyncio
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Alerte, User, Promotion, Module, Inscription
from app.models.user import Role
from app.security import decode_access_token


router = APIRouter()
logger = logging.getLogger(__name__)


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

    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    return (
        db.query(User)
        .filter(User.id == parsed_user_id, User.is_active == True)  # noqa: E712
        .first()
    )


def _alerts_query_for_user(db: Session, user: User):
    """Return a scoped alert query for the connected user."""

    q = db.query(Alerte).join(User, Alerte.etudiant_id == User.id)

    if user.role == Role.etudiant:
        return q.filter(Alerte.etudiant_id == user.id)

    if user.role == Role.chef_filiere and user.filiere_dirigee_id is not None:
        return q.join(Promotion, User.promotion_id == Promotion.id).filter(
            Promotion.filiere_id == user.filiere_dirigee_id
        )

    if user.role == Role.enseignant:
        return (
            q.join(Inscription, Inscription.etudiant_id == User.id)
            .join(Module, Inscription.module_id == Module.id)
            .filter(Module.enseignant_id == user.id)
            .distinct()
        )

    if user.role == Role.admin:
        return q

    return q.filter(False)


def _can_user_receive_alert(db: Session, user: User, alert: Alerte) -> bool:
    return (
        _alerts_query_for_user(db, user)
        .filter(Alerte.id == alert.id)
        .first()
        is not None
    )


class NotificationConnectionManager:
    """In-memory WebSocket connection registry.

    This is enough for the local/PFA Docker setup with one backend process.
    For multi-instance production deployment, use Redis pub/sub or a message broker.
    """

    def __init__(self) -> None:
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        self.active_connections.setdefault(user_id, set()).add(websocket)
        logger.info("WebSocket connected for user %s", user_id)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.active_connections.pop(user_id, None)

        logger.info("WebSocket disconnected for user %s", user_id)

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> None:
        connections = list(self.active_connections.get(user_id, set()))

        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "Failed to send WebSocket payload to user %s: %s",
                    user_id,
                    exc,
                )
                self.disconnect(user_id, websocket)

    async def push_alert(self, alert_id: int) -> None:
        """Push one alert to all currently connected users allowed to see it."""

        db = SessionLocal()

        try:
            alert = db.query(Alerte).filter(Alerte.id == alert_id).first()

            if not alert:
                return

            serialized_alert = _serialize_alert(alert)

            for user_id in list(self.active_connections.keys()):
                user = db.query(User).filter(User.id == user_id).first()

                if not user or not user.is_active:
                    continue

                if not _can_user_receive_alert(db, user, alert):
                    continue

                unread_count = (
                    _alerts_query_for_user(db, user)
                    .filter(Alerte.lue == False)  # noqa: E712
                    .count()
                )

                await self.send_to_user(
                    user_id,
                    {
                        "type": "alerts",
                        "unread_count": unread_count,
                        "alerts": [serialized_alert],
                    },
                )
        finally:
            db.close()


manager = NotificationConnectionManager()


async def notify_alert_created(alert_id: int) -> None:
    """Public helper for services that create alerts.

    Call this after the alert is committed or flushed.
    """

    await manager.push_alert(alert_id)


def notify_alert_created_background(alert_id: int) -> None:
    """Schedule a WebSocket push without blocking the caller.

    If there is no running event loop, the periodic WebSocket polling fallback
    will still deliver the alert within a few seconds.
    """

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.debug(
            "No running event loop while scheduling alert %s. "
            "Polling fallback will deliver it.",
            alert_id,
        )
        return

    loop.create_task(notify_alert_created(alert_id))


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """Push unread/new alerts to authenticated users.

    Authentication is performed using:
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
                    "message": "Token invalide ou expiré",
                }
            )
            await websocket.close(code=1008)
            return

        user_id = user.id
        user_role = user.role.value

        await manager.connect(user_id, websocket)

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
        manager.disconnect(user_id, websocket)

    except Exception as exc:  # pragma: no cover
        logger.exception("WebSocket notification loop failed: %s", exc)
        manager.disconnect(user_id, websocket)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass