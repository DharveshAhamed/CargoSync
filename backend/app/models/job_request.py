"""A company's request to hire a trucker's vehicle for a posted job."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class JobRequest(Base):
    __tablename__ = "job_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    truck_id = Column(String(36), ForeignKey("trucks.id"), nullable=False)
    trucker_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    job = relationship("Job", back_populates="requests")
    truck = relationship("Truck")
    trucker = relationship("Company", back_populates="job_requests")
