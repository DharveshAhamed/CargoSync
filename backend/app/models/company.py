"""
CargoSync — Company model (from ER Diagram: COMPANY entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    account_type = Column(String(30), nullable=False, default="company")  # company | trucker
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    trucks = relationship("Truck", back_populates="company", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="company", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="company", cascade="all, delete-orphan")
    team_invites = relationship("TeamInvite", back_populates="company", cascade="all, delete-orphan")
    job_requests = relationship("JobRequest", back_populates="trucker", cascade="all, delete-orphan")
