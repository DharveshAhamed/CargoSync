"""
CargoSync — Pydantic schemas for Box
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BoxCreate(BaseModel):
    job_id: str
    label_reference: str
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    stop_order: int = 1
    fragile: bool = False
    hazard: bool = False


class BoxUpdate(BaseModel):
    label_reference: Optional[str] = None
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    stop_order: Optional[int] = None
    fragile: Optional[bool] = None
    hazard: Optional[bool] = None


class BoxResponse(BaseModel):
    id: str
    job_id: str
    label_reference: str
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    stop_order: int
    fragile: bool
    hazard: bool
    qr_code: Optional[str] = None
    pack_x: Optional[float] = None
    pack_y: Optional[float] = None
    pack_z: Optional[float] = None
    pack_rotation: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
