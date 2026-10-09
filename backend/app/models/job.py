"""
CargoSync — Job model (from ER Diagram: JOB entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Text, Integer
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    truck_id = Column(String(36), ForeignKey("trucks.id"), nullable=True)
    job_name = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    time_window = Column(String(100), nullable=True)  # e.g., "09:00-17:00"
    description = Column(Text, nullable=True)
    pickup_location = Column(Text, nullable=True)
    delivery_location = Column(Text, nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="draft",
    )
    # Status flow: draft → posted → matched → accepted → loading → in_transit → out_for_delivery → delivered
    packing_data = Column(Text, nullable=True)  # JSON: 3D packing result
    rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="jobs")
    truck = relationship("Truck", back_populates="jobs")
    boxes = relationship("Box", back_populates="job", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="job", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="job")
    audit_logs = relationship("AuditLog", back_populates="job")
    requests = relationship("JobRequest", back_populates="job", cascade="all, delete-orphan")
