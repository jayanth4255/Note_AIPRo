# backend/app/database.py
"""
Database connection and session management for PostgreSQL
Auto-creates missing tables/columns on startup (for small projects)
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

# -----------------------------
# Create PostgreSQL engine
# -----------------------------
engine = create_engine(
    settings.database_url_validated,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# -----------------------------
# Session factory
# -----------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# -----------------------------
# Base class for models
# -----------------------------
Base = declarative_base()

# -----------------------------
# Create tables automatically
# -----------------------------
def init_db():
    from app import models  # ensures all models are imported
    Base.metadata.create_all(bind=engine)


# -----------------------------
# Dependency for DB session
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
