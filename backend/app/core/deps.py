"""
CargoSync Backend — Database session and dependency injection
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Generator

from app.core.config import get_settings
from app.core.security import decode_token

settings = get_settings()

# Database engine — uses psycopg3 driver for Supabase, SQLite for local dev
if settings.DATABASE_URL and "your-password-here" not in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://"),
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
else:
    # Fallback to SQLite for local development without Supabase
    import os
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cargosync.db")
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    print("ℹ Using local SQLite database (cargosync.db) — configure DATABASE_URL in .env for Supabase")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# HTTP Bearer token scheme
security = HTTPBearer()


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Dependency that extracts and validates the current user from JWT."""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    user_role = payload.get("role", "user")
    user_type = payload.get("user_type", "user")  # "admin" or "user"

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return {
        "id": user_id,
        "role": user_role,
        "user_type": user_type,
        "company_id": payload.get("company_id"),
    }


def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency that requires the user to be a platform admin."""
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_company_user(current_user: dict = Depends(get_current_user)):
    """Dependency that requires the user to belong to a company."""
    if not current_user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company membership required",
        )
    return current_user
