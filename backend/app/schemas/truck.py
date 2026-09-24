"""
CargoSync — Pydantic schemas for Truck
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TruckCreate(BaseModel):
    truck_name: str
    plate_number: str
    length_cm: float
    width_cm: float
    height_cm: float
    max_weight_kg: float
    driver_name: Optional[str] = None
    availability_schedule: Optional[str] = None


class TruckUpdate(BaseModel):
    truck_name: Optional[str] = None
    plate_number: Optional[str] = None
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    max_weight_kg: Optional[float] = None
    driver_name: Optional[str] = None
    driver_id: Optional[str] = None
    availability_schedule: Optional[str] = None
    is_active: Optional[bool] = None


class TruckResponse(BaseModel):
    id: str
    company_id: str
    truck_name: str
    plate_number: str
    length_cm: float
    width_cm: float
    height_cm: float
    max_weight_kg: float
    driver_name: Optional[str] = None
    driver_id: Optional[str] = None
    availability_schedule: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
