"""
CargoSync — Delivery model (from ER Diagram: DELIVERY entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    box_id = Column(String(36), ForeignKey("boxes.id"), nullable=True)
    stop_order = Column(Integer, nullable=False, default=1)
    recipient_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    signature_url = Column(Text, nullable=True)  # POD: e-signature image URL
    photo_url = Column(Text, nullable=True)  # POD: delivery photo URL
    gps_lat = Column(Float, nullable=True)  # POD: GPS latitude
    gps_lng = Column(Float, nullable=True)  # POD: GPS longitude
    notes = Column(Text, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="pending",
    )
    # Status: pending → scanned → in_transit → arrived → delivered
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    job = relationship("Job", back_populates="deliveries")
    box = relationship("Box", back_populates="delivery")
