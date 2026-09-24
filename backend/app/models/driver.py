"""
CargoSync — Driver model (standalone entity from ER Diagram)

Drivers are separate entities that can be linked to trucks.
A driver can be assigned to one truck at a time, but can be
reassigned over time.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="drivers")
    truck = relationship("Truck", back_populates="driver", uselist=False)
