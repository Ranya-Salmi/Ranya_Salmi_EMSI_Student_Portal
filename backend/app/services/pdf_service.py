"""
PDF generation service using WeasyPrint + Jinja2 templates.

Generates two artefacts:
  - Bulletins (one per student)
  - PV de deliberation (one per promotion + semester)

We render the HTML even if WeasyPrint isn't installed (returns HTML bytes); the
PDF conversion is gated behind a try/import so the API stays usable in dev.
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

_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=select_autoescape(["html"]))


def _html_to_pdf(html: str, output_path: Path) -> bool:
    """Render HTML to PDF using WeasyPrint. Returns True on success, False if
    WeasyPrint isn't available — in that case we write the HTML as a .pdf.html
    next to it for inspection."""
    try:
        from weasyprint import HTML  # heavy import — lazy
        HTML(string=html).write_pdf(str(output_path))
        return True
    except Exception:  # pragma: no cover
        output_path.with_suffix(".pdf.html").write_text(html, encoding="utf-8")
        return False


def generate_bulletin(db: Session, etudiant_id: int, semestre: int = 2) -> Bulletin:
    etu = db.query(User).filter(User.id == etudiant_id).first()
    if not etu:
        raise ValueError("Etudiant introuvable")

    promo = db.query(Promotion).filter(Promotion.id == etu.promotion_id).first() if etu.promotion_id else None
    modules_q = (
        db.query(Module)
        .filter(Module.promotion_id == etu.promotion_id, Module.semestre == semestre)
        .all() if etu.promotion_id else []
    )

    modules_data = []
    for m in modules_q:
        moyenne = stats_service.compute_module_average(db, etu.id, m.id)
        modules_data.append({"nom": m.nom, "coefficient": m.coefficient, "moyenne": moyenne})

    moyenne_generale = stats_service.compute_general_average(db, etu.id)
    taux_absence = stats_service.compute_absence_rate(db, etu.id)

    # Decision logic
    if moyenne_generale is None:
        decision, decision_class = "En attente", ""
    elif moyenne_generale >= 12:
        decision, decision_class = "Admis", "admis"
    elif moyenne_generale >= 10:
        decision, decision_class = "Admis", "admis"
    elif moyenne_generale >= 8:
        decision, decision_class = "Rattrapage", "rattrapage"
    else:
        decision, decision_class = "Ajourne", "ajourne"

    # Persist record first to get the id
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


def generate_pv(db: Session, promotion_id: int, semestre: int = 2, valider: bool = False) -> PV:
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise ValueError("Promotion introuvable")

    modules = db.query(Module).filter(
        Module.promotion_id == promotion_id, Module.semestre == semestre
    ).all()

    etudiants = [u for u in promo.etudiants if u.is_active]
    rows = []
    nb_admis = 0
    for etu in etudiants:
        notes_modules = [stats_service.compute_module_average(db, etu.id, m.id) for m in modules]
        moyenne = stats_service.compute_general_average(db, etu.id)
        admis = moyenne is not None and moyenne >= 10
        if admis:
            nb_admis += 1
        rows.append({
            "cne": etu.cne, "full_name": etu.full_name,
            "notes_modules": notes_modules, "moyenne": moyenne, "admis": admis,
        })

    rows.sort(key=lambda r: r["full_name"])

    pv = PV(promotion_id=promotion_id, semestre=semestre, statut="brouillon")
    db.add(pv); db.flush()

    output_path = OUTPUT_DIR / f"pv_{pv.id}.pdf"

    html = _env.get_template("pv.html").render(
        promotion=promo, semestre=semestre, modules=modules,
        etudiants=rows, nb_admis=nb_admis,
        nb_ajournes=len(rows) - nb_admis,
        date_generation=datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        pv_id=pv.id,
        hash_controle=None,
    )

    # Compute SHA-256 of HTML for integrity check
    hash_ctrl = hashlib.sha256(html.encode("utf-8")).hexdigest()
    pv.hash_controle = hash_ctrl

    if valider:
        pv.statut = "valide"
        pv.signature_numerique = hashlib.sha256(f"{pv.id}-{hash_ctrl}".encode()).hexdigest()
        pv.date_validation = datetime.utcnow()

    # Re-render with the hash included
    html_final = _env.get_template("pv.html").render(
        promotion=promo, semestre=semestre, modules=modules,
        etudiants=rows, nb_admis=nb_admis,
        nb_ajournes=len(rows) - nb_admis,
        date_generation=datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        pv_id=pv.id, hash_controle=hash_ctrl,
    )
    _html_to_pdf(html_final, output_path)
    pv.chemin_fichier = str(output_path)

    db.commit()
    db.refresh(pv)
    return pv
