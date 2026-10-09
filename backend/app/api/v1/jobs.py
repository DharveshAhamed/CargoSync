"""
CargoSync — Job management API routes
Handles job CRUD, status transitions, and marketplace flow
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field

from app.core.deps import get_db, require_company_user
from app.models.job import Job
from app.models.box import Box
from app.models.delivery import Delivery
from app.models.truck import Truck
from app.models.job_request import JobRequest
from app.models.company import Company
from app.models.audit_log import AuditLog
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobDetailResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class TruckRequestCreate(BaseModel):
    truck_id: str
    message: str | None = None


class RatingCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback: str | None = None


def _can_access(job: Job, user: dict, db: Session) -> bool:
    if user["user_type"] == "company":
        return job.company_id == user["company_id"]
    if user["user_type"] == "trucker":
        return bool(job.truck_id and db.query(Truck).filter(
            Truck.id == job.truck_id, Truck.company_id == user["company_id"]
        ).first())
    return False

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
    """List owned jobs for companies and accepted jobs for truckers."""
    if current_user["user_type"] == "trucker":
        truck_ids = [row[0] for row in db.query(Truck.id).filter(Truck.company_id == current_user["company_id"]).all()]
        query = db.query(Job).filter(Job.truck_id.in_(truck_ids))
    else:
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
            description=job.description,
            pickup_location=job.pickup_location,
            delivery_location=job.delivery_location,
            status=job.status,
            packing_data=job.packing_data,
            created_at=job.created_at,
            box_count=box_count,
            delivery_count=delivery_count,
            rating=job.rating,
            feedback=job.feedback,
        )
        result.append(job_dict)
    return result


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Create a new company freight job."""
    if current_user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Only company accounts can post jobs")
    if data.truck_id:
        truck = (
            db.query(Truck)
            .filter(Truck.id == data.truck_id, Truck.is_active == True)
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
        description=job.description,
        pickup_location=job.pickup_location,
        delivery_location=job.delivery_location,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=0,
        delivery_count=0,
        rating=job.rating,
        feedback=job.feedback,
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
        .filter(Job.id == job_id)
        .first()
    )
    if not job or not _can_access(job, current_user, db):
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
        description=job.description,
        pickup_location=job.pickup_location,
        delivery_location=job.delivery_location,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=len(boxes),
        delivery_count=len(deliveries),
        rating=job.rating,
        feedback=job.feedback,
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
        .filter(Job.id == job_id)
        .first()
    )
    if not job or not _can_access(job, current_user, db):
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
        description=job.description,
        pickup_location=job.pickup_location,
        delivery_location=job.delivery_location,
        status=job.status,
        packing_data=job.packing_data,
        created_at=job.created_at,
        box_count=box_count,
        delivery_count=delivery_count,
        rating=job.rating,
        feedback=job.feedback,
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


@router.get("/marketplace/trucks")
def search_available_trucks(
    min_weight_kg: float | None = None,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Search active vehicles published by registered truckers."""
    if current_user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Company account required")
    query = db.query(Truck, Company).join(Company, Company.id == Truck.company_id).filter(
        Company.account_type == "trucker", Truck.is_active == True
    )
    if min_weight_kg:
        query = query.filter(Truck.max_weight_kg >= min_weight_kg)
    return [{
        "id": truck.id, "truck_name": truck.truck_name, "plate_number": truck.plate_number,
        "length_cm": truck.length_cm, "width_cm": truck.width_cm, "height_cm": truck.height_cm,
        "max_weight_kg": truck.max_weight_kg, "driver_name": truck.driver_name,
        "availability_schedule": truck.availability_schedule,
        "trucker_id": owner.id, "trucker_name": owner.name,
    } for truck, owner in query.order_by(Truck.created_at.desc()).all()]


@router.post("/{job_id}/requests", status_code=status.HTTP_201_CREATED)
def request_truck(
    job_id: str, data: TruckRequestCreate,
    current_user: dict = Depends(require_company_user), db: Session = Depends(get_db),
):
    if current_user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Company account required")
    job = db.query(Job).filter(Job.id == job_id, Job.company_id == current_user["company_id"]).first()
    truck = db.query(Truck).filter(Truck.id == data.truck_id, Truck.is_active == True).first()
    if not job or not truck:
        raise HTTPException(status_code=404, detail="Job or truck not found")
    existing = db.query(JobRequest).filter(JobRequest.job_id == job_id, JobRequest.truck_id == data.truck_id,
                                           JobRequest.status == "pending").first()
    if existing:
        raise HTTPException(status_code=400, detail="Request already sent")
    request = JobRequest(job_id=job.id, truck_id=truck.id, trucker_id=truck.company_id, message=data.message)
    job.status = "matched"
    db.add(request)
    db.add(AuditLog(job_id=job.id, user_id=current_user["id"], action="truck_requested",
                    details=f"Request sent for truck {truck.plate_number}"))
    db.commit()
    db.refresh(request)
    return {"id": request.id, "status": request.status, "message": "Job request sent to trucker"}


@router.get("/requests/incoming")
def incoming_requests(current_user: dict = Depends(require_company_user), db: Session = Depends(get_db)):
    if current_user["user_type"] != "trucker":
        raise HTTPException(status_code=403, detail="Trucker account required")
    rows = db.query(JobRequest, Job, Truck, Company).join(Job, Job.id == JobRequest.job_id).join(
        Truck, Truck.id == JobRequest.truck_id).join(Company, Company.id == Job.company_id).filter(
        JobRequest.trucker_id == current_user["company_id"]).order_by(JobRequest.created_at.desc()).all()
    return [{"id": req.id, "status": req.status, "message": req.message, "created_at": req.created_at,
             "job_id": job.id, "job_name": job.job_name, "description": job.description,
             "pickup_location": job.pickup_location, "delivery_location": job.delivery_location,
             "date": job.date, "company_name": owner.name, "truck_name": truck.truck_name,
             "plate_number": truck.plate_number} for req, job, truck, owner in rows]


@router.post("/requests/{request_id}/accept")
def accept_request(request_id: str, current_user: dict = Depends(require_company_user), db: Session = Depends(get_db)):
    if current_user["user_type"] != "trucker":
        raise HTTPException(status_code=403, detail="Trucker account required")
    req = db.query(JobRequest).filter(JobRequest.id == request_id,
                                      JobRequest.trucker_id == current_user["company_id"]).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Pending request not found")
    req.status = "accepted"
    req.job.truck_id = req.truck_id
    req.job.status = "accepted"
    db.query(JobRequest).filter(JobRequest.job_id == req.job_id, JobRequest.id != req.id).update({"status": "declined"})
    db.add(AuditLog(job_id=req.job_id, user_id=current_user["id"], action="job_accepted",
                    details=f"Accepted by trucker for {req.truck.plate_number}"))
    db.commit()
    return {"message": "Job accepted", "job_id": req.job_id}


@router.post("/{job_id}/rating")
def rate_driver(job_id: str, data: RatingCreate, current_user: dict = Depends(require_company_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.company_id == current_user["company_id"],
                               Job.status == "delivered").first()
    if not job or current_user["user_type"] != "company":
        raise HTTPException(status_code=404, detail="Delivered job not found")
    job.rating, job.feedback = data.rating, data.feedback
    db.add(AuditLog(job_id=job.id, user_id=current_user["id"], action="driver_rated",
                    details=f"Driver rated {data.rating}/5"))
    db.commit()
    return {"message": "Feedback submitted", "rating": job.rating}
