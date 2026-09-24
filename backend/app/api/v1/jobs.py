"""
CargoSync — Job management API routes
Handles job CRUD, status transitions, and marketplace flow
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_company_user
from app.models.job import Job
from app.models.box import Box
from app.models.delivery import Delivery
from app.models.truck import Truck
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobDetailResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Valid status transitions
VALID_TRANSITIONS = {
    "draft": ["posted"],
    "posted": ["matched", "draft"],
    "matched": ["accepted", "posted"],
    "accepted": ["loading"],
    "loading": ["in_transit"],
    "in_transit": ["out_for_delivery"],
    "out_for_delivery": ["delivered"],
    "delivered": [],
}


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    status_filter: str = None,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """List all jobs for the current company."""
    query = db.query(Job).filter(Job.company_id == current_user["company_id"])
    if status_filter:
        query = query.filter(Job.status == status_filter)

    jobs = query.order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        box_count = db.query(Box).filter(Box.job_id == job.id).count()
        delivery_count = db.query(Delivery).filter(Delivery.job_id == job.id).count()
        job_dict = JobResponse(
            id=job.id,
            company_id=job.company_id,
            truck_id=job.truck_id,
            job_name=job.job_name,
            date=job.date,
            time_window=job.time_window,
            status=job.status,
            packing_data=job.packing_data,
            created_at=job.created_at,
            box_count=box_count,
            delivery_count=delivery_count,
        )
        result.append(job_dict)
    return result


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Create a new job."""
    if data.truck_id:
        truck = (
            db.query(Truck)
            .filter(Truck.id == data.truck_id, Truck.company_id == current_user["company_id"])
            .first()
        )
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")

    job = Job(
        company_id=current_user["company_id"],
        **data.model_dump(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobResponse(
        id=job.id,
        company_id=job.company_id,
        truck_id=job.truck_id,
        job_name=job.job_name,
        date=job.date,
        time_window=job.time_window,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=0,
        delivery_count=0,
    )


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get detailed job information including boxes and deliveries."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    boxes = db.query(Box).filter(Box.job_id == job.id).order_by(Box.stop_order).all()
    deliveries = db.query(Delivery).filter(Delivery.job_id == job.id).order_by(Delivery.stop_order).all()
    truck = db.query(Truck).filter(Truck.id == job.truck_id).first() if job.truck_id else None

    return JobDetailResponse(
        id=job.id,
        company_id=job.company_id,
        truck_id=job.truck_id,
        job_name=job.job_name,
        date=job.date,
        time_window=job.time_window,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=len(boxes),
        delivery_count=len(deliveries),
        boxes=[
            {
                "id": b.id, "label_reference": b.label_reference,
                "length_cm": b.length_cm, "width_cm": b.width_cm, "height_cm": b.height_cm,
                "weight_kg": b.weight_kg, "stop_order": b.stop_order,
                "fragile": b.fragile, "hazard": b.hazard, "qr_code": b.qr_code,
                "pack_x": b.pack_x, "pack_y": b.pack_y, "pack_z": b.pack_z,
                "pack_rotation": b.pack_rotation,
            }
            for b in boxes
        ],
        deliveries=[
            {
                "id": d.id, "box_id": d.box_id, "stop_order": d.stop_order,
                "recipient_name": d.recipient_name, "address": d.address,
                "status": d.status, "delivered_at": str(d.delivered_at) if d.delivered_at else None,
            }
            for d in deliveries
        ],
        truck={
            "id": truck.id, "truck_name": truck.truck_name,
            "plate_number": truck.plate_number,
            "length_cm": truck.length_cm, "width_cm": truck.width_cm, "height_cm": truck.height_cm,
            "max_weight_kg": truck.max_weight_kg,
        } if truck else None,
    )


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    data: JobUpdate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Update a job's details or status."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Validate status transition
    if data.status and data.status != job.status:
        valid_next = VALID_TRANSITIONS.get(job.status, [])
        if data.status not in valid_next:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{job.status}' to '{data.status}'. Valid: {valid_next}",
            )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    box_count = db.query(Box).filter(Box.job_id == job.id).count()
    delivery_count = db.query(Delivery).filter(Delivery.job_id == job.id).count()

    return JobResponse(
        id=job.id,
        company_id=job.company_id,
        truck_id=job.truck_id,
        job_name=job.job_name,
        date=job.date,
        time_window=job.time_window,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=box_count,
        delivery_count=delivery_count,
    )


@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Delete a job (only if in draft status)."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "draft":
        raise HTTPException(status_code=400, detail="Can only delete draft jobs")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
