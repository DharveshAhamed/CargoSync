"""
CargoSync — Pydantic schemas for Delivery
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DeliveryCreate(BaseModel):
    job_id: str
    box_id: Optional[str] = None
    stop_order: int = 1
    recipient_name: str
    address: Optional[str] = None


class DeliveryUpdate(BaseModel):
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    stop_order: Optional[int] = None
    status: Optional[str] = None


class PODSubmit(BaseModel):
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    notes: Optional[str] = None


class DeliveryResponse(BaseModel):
    id: str
    job_id: str
    box_id: Optional[str] = None
    stop_order: int
    recipient_name: str
    address: Optional[str] = None
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    notes: Optional[str] = None
    delivered_at: Optional[datetime] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
