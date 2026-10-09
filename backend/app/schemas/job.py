"""
CargoSync — Pydantic schemas for Job
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class JobCreate(BaseModel):
    job_name: str
    date: date
    truck_id: Optional[str] = None
    time_window: Optional[str] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None


class JobUpdate(BaseModel):
    job_name: Optional[str] = None
    date: Optional[date] = None
    truck_id: Optional[str] = None
    time_window: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    company_id: str
    truck_id: Optional[str] = None
    job_name: str
    date: date
    time_window: Optional[str] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    status: str
    packing_data: Optional[str] = None
    created_at: datetime
    box_count: Optional[int] = None
    delivery_count: Optional[int] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None

    model_config = {"from_attributes": True}


class JobDetailResponse(JobResponse):
    boxes: Optional[List[dict]] = []
    deliveries: Optional[List[dict]] = []
    truck: Optional[dict] = None
