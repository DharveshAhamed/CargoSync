"""
CargoSync — Truck model (from ER Diagram: TRUCK entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    driver_id = Column(String(36), ForeignKey("drivers.id"), nullable=True)
    truck_name = Column(String(255), nullable=False)
    plate_number = Column(String(50), unique=True, nullable=False)
    length_cm = Column(Float, nullable=False)
    width_cm = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    max_weight_kg = Column(Float, nullable=False)
    driver_name = Column(String(255), nullable=True)  # Kept for backward compat
    availability_schedule = Column(Text, nullable=True)  # JSON string of schedule
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="trucks")
    driver = relationship("Driver", back_populates="truck", foreign_keys=[driver_id])
    jobs = relationship("Job", back_populates="truck")
