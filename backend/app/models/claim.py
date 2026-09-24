"""
CargoSync — Claim model (from ER Diagram: CLAIM entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    description = Column(Text, nullable=False)
    proof_url = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open")  # open, reviewing, resolved, rejected
    admin_notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="claims")
    job = relationship("Job", back_populates="claims")
