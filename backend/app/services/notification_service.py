"""
Notification service.

This service sends alert notifications by email when SMTP is configured.
If SMTP variables are missing, it safely skips email sending so the local
PFA demo remains functional.
"""
from email.message import EmailMessage
import logging
import smtplib

from app.config import settings
from app.models import Alerte, User

logger = logging.getLogger(__name__)


def email_enabled() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


def send_alert_email(etudiant: User, alerte: Alerte) -> bool:
    """Send one alert email to a student.

    Returns True if the email was sent.
    Returns False if SMTP is disabled, the student has no email, or sending fails.
    """

    if not email_enabled():
        logger.info(
            "SMTP non configuré. Email notification ignoré pour l'alerte %s.",
            alerte.id,
        )
        return False

    if not etudiant.email:
        logger.info(
            "L'étudiant %s n'a pas d'email. Notification ignorée.",
            etudiant.id,
        )
        return False

    message = EmailMessage()
    message["Subject"] = f"[Portail EMSI] {alerte.titre}"
    message["From"] = settings.smtp_from
    message["To"] = etudiant.email

    message.set_content(
        f"""Bonjour {etudiant.full_name},

{alerte.message}

Type d'alerte : {alerte.type}
Urgence : {alerte.urgence}

Merci de consulter votre espace Portail EMSI pour plus de détails.

Cordialement,
Portail EMSI
"""
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)

        logger.info(
            "Email d'alerte envoyé à %s pour l'alerte %s.",
            etudiant.email,
            alerte.id,
        )
        return True

    except Exception as exc:
        logger.exception(
            "Échec d'envoi email à %s pour l'alerte %s: %s",
            etudiant.email,
            alerte.id,
            exc,
        )
        return False