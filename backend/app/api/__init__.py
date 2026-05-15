from fastapi import APIRouter

from app.api import auth, users, notes, absences, dashboard, audit, pdf, csv_io, academic

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/admin", tags=["admin"])
api_router.include_router(academic.router, prefix="/academic", tags=["academic"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(absences.router, prefix="/absences", tags=["absences"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(pdf.router, prefix="/pdf", tags=["pdf"])
api_router.include_router(csv_io.router, prefix="/csv", tags=["csv"])
