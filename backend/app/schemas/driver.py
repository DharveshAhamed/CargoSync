"""
CargoSync — Pydantic schemas for Driver
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DriverCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    notes: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class DriverResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    truck_plate: Optional[str] = None  # Populated manually from linked truck

    model_config = {"from_attributes": True}
