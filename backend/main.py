"""
MapTrack AI — FastAPI backend
Run: uvicorn main:app --reload
Docs: http://localhost:8000/docs

Architecture:
- Three routers: places (CRUD), routes (saved routes), ai (categorization & summarization)
- SQLAlchemy ORM with SQLite (easily swappable for Postgres in production)
- Pydantic schemas for validation
- Multi-provider AI fallback (OpenAI → Gemini → Groq)
- CORS enabled for Vite dev server (http://localhost:5173)
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import Base, engine
from routers import ai, places, routes

load_dotenv()

logging.basicConfig(level=logging.INFO)

# ── Create tables ────────────────────────────────────────────────────────────
# In production you'd use Alembic migrations; for the MVP this is fine.
Base.metadata.create_all(bind=engine)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MapTrack AI",
    description="Personal map tracker with AI-assisted categorization and summarization.",
    version="0.1.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(places.router)
app.include_router(routes.router)
app.include_router(ai.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "MapTrack AI"}
