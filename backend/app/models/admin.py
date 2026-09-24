"""
CargoSync — Admin model (from ER Diagram: ADMIN entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.core.deps import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="super_admin")  # super_admin, support
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
