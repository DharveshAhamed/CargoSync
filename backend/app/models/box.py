"""
CargoSync — Box model (from ER Diagram: BOX entity)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.deps import Base


class Box(Base):
    __tablename__ = "boxes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    label_reference = Column(String(255), nullable=False)
    length_cm = Column(Float, nullable=False)
    width_cm = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    stop_order = Column(Integer, nullable=False, default=1)  # Delivery stop sequence
    fragile = Column(Boolean, default=False, nullable=False)
    hazard = Column(Boolean, default=False, nullable=False)
    qr_code = Column(Text, nullable=True)  # QR code data/URL

    # 3D packing placement (set by bin packing algorithm)
    pack_x = Column(Float, nullable=True)
    pack_y = Column(Float, nullable=True)
    pack_z = Column(Float, nullable=True)
    pack_rotation = Column(Integer, default=0)  # 0-5 for 6 possible rotations

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    job = relationship("Job", back_populates="boxes")
    delivery = relationship("Delivery", back_populates="box", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="box")
