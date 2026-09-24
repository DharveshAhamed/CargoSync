"""
CargoSync — Pydantic schemas for Admin operations
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AdminUserCreate(BaseModel):
    company_id: str
    name: str
    email: str
    password: str
    role: str = "user"


class AdminCompanyCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    job_id: str
    box_id: Optional[str] = None
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    scanned_at: datetime

    model_config = {"from_attributes": True}
