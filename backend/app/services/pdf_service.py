"""
PDF generation service using WeasyPrint + Jinja2 templates.

Generates two artefacts:
  - Bulletins (one per student)
  - PV de deliberation (one per promotion + semester)

The service renders HTML first, then attempts PDF conversion with WeasyPrint.
If WeasyPrint is unavailable, an HTML fallback file is stored next to the
expected PDF path.

For PV integrity, hash_controle is computed from the generated artefact
(PDF if available, otherwise HTML fallback).
"""
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
import hashlib

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from app.models import User, Promotion, Module, PV, Bulletin
from app.services import stats_service


TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"
OUTPUT_DIR = Path("/tmp/emsi_pdf")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def get_generated_file_path(path_value: str | Path | None) -> Path:
    """Return the actual generated file path.

    We prefer the PDF path when it exists. If WeasyPrint is unavailable,
    _html_to_pdf writes a .pdf.html fallback file; this helper returns that
    fallback instead.
    """

    if not path_value:
        raise FileNotFoundError("Chemin de fichier manquant")

    path = Path(path_value)

    if path.exists():
        return path

    fallback = path.with_suffix(".pdf.html")

    if fallback.exists():
        return fallback

    raise FileNotFoundError(f"Fichier introuvable: {path}")


def compute_document_sha256(path_value: str | Path | None) -> str:
    """Compute SHA-256 from the actual generated artefact."""

    path = get_generated_file_path(path_value)
    sha256 = hashlib.sha256()

    with path.open("rb") as file:
      for chunk in iter(lambda: file.read(8192), b""):
          sha256.update(chunk)

    return sha256.hexdigest()


def _html_to_pdf(html: str, output_path: Path) -> bool:
    """Render HTML to PDF using WeasyPrint.

    Returns True when a PDF is created.
    Returns False when the HTML fallback is created.
    """

    try:
        from weasyprint import HTML  # heavy import, lazy-loaded

        HTML(string=html).write_pdf(str(output_path))
        return True
    except Exception:  # pragma: no cover
        output_path.with_suffix(".pdf.html").write_text(html, encoding="utf-8")
        return False


def generate_bulletin(db: Session, etudiant_id: int, semestre: int = 2) -> Bulletin:
    etu = db.query(User).filter(User.id == etudiant_id).first()

    if not etu:
        raise ValueError("Etudiant introuvable")

    promo = (
        db.query(Promotion).filter(Promotion.id == etu.promotion_id).first()
        if etu.promotion_id
        else None
    )

    modules_q = (
        db.query(Module)
        .filter(Module.promotion_id == etu.promotion_id, Module.semestre == semestre)
        .all()
        if etu.promotion_id
        else []
    )

    modules_data = []

    for module in modules_q:
        moyenne = stats_service.compute_module_average(db, etu.id, module.id)

        modules_data.append(
            {
                "nom": module.nom,
                "coefficient": module.coefficient,
                "moyenne": moyenne,
            }
        )

    moyenne_generale = stats_service.compute_general_average(db, etu.id)
    taux_absence = stats_service.compute_absence_rate(db, etu.id)

    if moyenne_generale is None:
        decision, decision_class = "En attente", ""
    elif moyenne_generale >= 10:
        decision, decision_class = "Admis", "admis"
    elif moyenne_generale >= 8:
        decision, decision_class = "Rattrapage", "rattrapage"
    else:
        decision, decision_class = "Ajourne", "ajourne"

    bulletin = Bulletin(
        etudiant_id=etu.id,
        semestre=semestre,
        moyenne_generale=moyenne_generale,
        decision=decision,
    )

    db.add(bulletin)
    db.flush()

    output_path = OUTPUT_DIR / f"bulletin_{bulletin.id}.pdf"

    html = _env.get_template("bulletin.html").render(
        etudiant=etu,
        promotion_nom=promo.nom if promo else None,
        annee=promo.annee if promo else "",
        semestre=semestre,
        modules=modules_data,
        moyenne_generale=moyenne_generale,
        taux_absence=taux_absence,
        decision=decision,
        decision_class=decision_class,
        date_generation=datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        bulletin_id=bulletin.id,
    )

    _html_to_pdf(html, output_path)

    bulletin.chemin_fichier = str(output_path)

    db.commit()
    db.refresh(bulletin)

    return bulletin


def generate_pv(
    db: Session,
    promotion_id: int,
    semestre: int = 2,
    valider: bool = False,
) -> PV:
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()

    if not promo:
        raise ValueError("Promotion introuvable")

    modules = (
        db.query(Module)
        .filter(Module.promotion_id == promotion_id, Module.semestre == semestre)
        .all()
    )

    etudiants = [student for student in promo.etudiants if student.is_active]
    rows = []
    nb_admis = 0

    for etu in etudiants:
        notes_modules = [
            stats_service.compute_module_average(db, etu.id, module.id)
            for module in modules
        ]

        moyenne = stats_service.compute_general_average(db, etu.id)
        admis = moyenne is not None and moyenne >= 10

        if admis:
            nb_admis += 1

        rows.append(
            {
                "cne": etu.cne,
                "full_name": etu.full_name,
                "notes_modules": notes_modules,
                "moyenne": moyenne,
                "admis": admis,
            }
        )

    rows.sort(key=lambda row: row["full_name"])

    pv = PV(promotion_id=promotion_id, semestre=semestre, statut="brouillon")

    db.add(pv)
    db.flush()

    output_path = OUTPUT_DIR / f"pv_{pv.id}.pdf"
    generation_date = datetime.utcnow().strftime("%d/%m/%Y %H:%M")

    html = _env.get_template("pv.html").render(
        promotion=promo,
        semestre=semestre,
        modules=modules,
        etudiants=rows,
        nb_admis=nb_admis,
        nb_ajournes=len(rows) - nb_admis,
        date_generation=generation_date,
        pv_id=pv.id,
        hash_controle=None,
    )

    _html_to_pdf(html, output_path)

    pv.chemin_fichier = str(output_path)
    pv.hash_controle = compute_document_sha256(output_path)

    if valider:
        pv.statut = "valide"
        pv.signature_numerique = hashlib.sha256(
            f"{pv.id}-{pv.hash_controle}".encode("utf-8")
        ).hexdigest()
        pv.date_validation = datetime.utcnow()

    db.commit()
    db.refresh(pv)

    return pv