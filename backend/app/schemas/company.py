"""
CargoSync — Pydantic schemas for Company
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
