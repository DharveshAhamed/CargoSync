"""
CargoSync — AuditLog model (Chain of Custody tracking)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    box_id = Column(String(36), ForeignKey("boxes.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    # Actions: box_created, qr_generated, loading_scanned, transit_started,
    #          tamper_detected, delivery_scanned, pod_submitted, status_changed
    details = Column(Text, nullable=True)  # JSON with additional context
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    scanned_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    job = relationship("Job", back_populates="audit_logs")
    box = relationship("Box", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
