"""
CargoSync — TeamInvite model (Team member invitation management)
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.deps import Base


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    token = Column(String(255), unique=True, nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, accepted, expired
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=7),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="team_invites")
