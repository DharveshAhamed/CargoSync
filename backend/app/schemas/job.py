"""
CargoSync — Pydantic schemas for Job
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List, Union
from datetime import date, datetime


class JobCreate(BaseModel):
    job_name: str
    date: Union[date, str]
    truck_id: Optional[str] = None
    time_window: Optional[str] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None

    @field_validator("date", mode="before")
    def parse_date(cls, v):
        if isinstance(v, str) and "T" in v:
            return v.split("T")[0]
        return v


class JobUpdate(BaseModel):
    job_name: Optional[str] = None
    date: Optional[Union[date, str]] = None
    truck_id: Optional[str] = None
    time_window: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None

    @field_validator("date", mode="before")
    def parse_date(cls, v):
        if isinstance(v, str) and "T" in v:
            return v.split("T")[0]
        return v


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


class EndTripRequest(BaseModel):
    recipient_name: Optional[str] = None
    notes: Optional[str] = None
    verified_box_ids: Optional[List[str]] = None
    condition_verified: Optional[bool] = True

