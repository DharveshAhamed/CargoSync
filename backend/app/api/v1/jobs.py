"""
CargoSync — Job management API routes
Handles job CRUD, status transitions, and marketplace flow
"""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.deps import get_db, require_company_user
from app.models.job import Job
from app.models.box import Box
from app.models.delivery import Delivery
from app.models.truck import Truck
from app.models.job_request import JobRequest
from app.models.company import Company
from app.models.audit_log import AuditLog
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobDetailResponse, EndTripRequest

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class TruckRequestCreate(BaseModel):
    truck_id: str
    message: str | None = None


class RatingCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback: str | None = None


from app.services.access import can_access_job

def _can_access(job: Job, user: dict, db: Session) -> bool:
    return can_access_job(job, user, db)

# Valid status transitions
VALID_TRANSITIONS = {
    "draft": ["posted"],
    "posted": ["matched", "draft", "accepted"],
    "matched": ["accepted", "posted"],
    "accepted": ["loading", "in_transit"],
    "loading": ["in_transit", "accepted"],
    "in_transit": ["out_for_delivery", "delivered"],
    "out_for_delivery": ["delivered"],
    "delivered": [],
}


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    status_filter: str = None,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """List owned jobs for companies, assigned jobs for truckers, or available freight to accept."""
    if current_user["user_type"] == "trucker":
        if status_filter in ("posted", "matched"):
            query = db.query(Job).filter(Job.status == status_filter)
        elif status_filter == "available":
            query = db.query(Job).filter(Job.status.in_(["posted", "matched"]))
        else:
            truck_ids = [row[0] for row in db.query(Truck.id).filter(Truck.company_id == current_user["company_id"]).all()]
            query = db.query(Job).filter(Job.truck_id.in_(truck_ids))
            if status_filter:
                query = query.filter(Job.status == status_filter)
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


class JobAcceptPayload(BaseModel):
    truck_id: str | None = None


@router.post("/{job_id}/accept")
def trucker_accept_job(
    job_id: str,
    payload: JobAcceptPayload | None = None,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Allow a trucker to accept an available job directly with their truck."""
    if current_user["user_type"] not in ("trucker", "admin"):
        raise HTTPException(status_code=403, detail="Trucker account required to accept jobs")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in ("posted", "matched", "draft"):
        raise HTTPException(status_code=400, detail=f"Job cannot be accepted in '{job.status}' status")

    truck_id = payload.truck_id if payload else None
    truck = None
    if truck_id:
        truck = db.query(Truck).filter(Truck.id == truck_id, Truck.company_id == current_user["company_id"]).first()
    if not truck:
        truck = db.query(Truck).filter(Truck.company_id == current_user["company_id"], Truck.is_active == True).first()
    if not truck:
        raise HTTPException(status_code=400, detail="No active truck available in your fleet")

    job.truck_id = truck.id
    job.status = "accepted"
    db.add(AuditLog(
        job_id=job.id,
        user_id=current_user["id"],
        action="job_accepted",
        details=f"Directly accepted by trucker with truck {truck.plate_number}",
    ))
    db.commit()
    return {"message": "Job accepted successfully", "job_id": job.id, "truck_id": truck.id}


@router.post("/{job_id}/start-trip")
def start_trip(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Allow a trucker to start a trip after 3D cargo packing and verification."""
    if current_user["user_type"] not in ("trucker", "admin"):
        raise HTTPException(status_code=403, detail="Only truckers can start trips")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in ("accepted", "loading"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start trip: job status is '{job.status}'. Must be 'accepted' or 'loading'.",
        )

    # Verify that cargo packing has been calculated
    if not job.packing_data:
        box_count = db.query(Box).filter(Box.job_id == job.id).count()
        if box_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot start trip: Please run 'Pack Boxes (3D)' first to verify cargo arrangement.",
            )

    job.status = "in_transit"
    db.add(AuditLog(
        job_id=job.id,
        user_id=current_user["id"],
        action="trip_started",
        details=f"Trucker started trip for {job.job_name}. Cargo in transit.",
    ))

    # Also transition any other jobs consolidated on the same truck
    if job.truck_id:
        bundled_jobs = db.query(Job).filter(
            Job.truck_id == job.truck_id,
            Job.id != job.id,
            Job.status.in_(["accepted", "loading"]),
        ).all()
        for bj in bundled_jobs:
            bj.status = "in_transit"
            db.add(AuditLog(
                job_id=bj.id,
                user_id=current_user["id"],
                action="trip_started",
                details=f"Consolidated trip started on truck alongside '{job.job_name}'. Cargo in transit.",
            ))

    db.commit()
    return {"message": "Trip started successfully! All consolidated cargo on this truck is now in transit.", "status": job.status}


@router.post("/{job_id}/end-trip")
def end_trip(
    job_id: str,
    data: Optional[EndTripRequest] = None,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Allow a trucker to end the job at destination with delivery load verification checklist."""
    if current_user["user_type"] not in ("trucker", "admin"):
        raise HTTPException(status_code=403, detail="Only truckers can complete deliveries and end trips")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in ("in_transit", "out_for_delivery"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot end trip: job status is '{job.status}'. Job must be 'in_transit' or 'out_for_delivery'.",
        )

    job.status = "delivered"

    # Delivery verification details
    recipient_name = (data.recipient_name if data and data.recipient_name else None) or (getattr(job.company, "name", None) if job.company else "Consignee")
    delivery_notes = (data.notes if data and data.notes else None) or "Verified and unloaded at destination"
    verified_count = len(data.verified_box_ids) if data and data.verified_box_ids else db.query(Box).filter(Box.job_id == job.id).count()

    # Update or create delivery stops
    deliveries = db.query(Delivery).filter(Delivery.job_id == job.id).all()
    if deliveries:
        for d in deliveries:
            d.status = "delivered"
            d.delivered_at = datetime.now(timezone.utc)
            if data and data.recipient_name:
                d.recipient_name = data.recipient_name
            if data and data.notes:
                d.notes = data.notes
    else:
        # Create completed delivery record
        delivery = Delivery(
            job_id=job.id,
            stop_order=1,
            recipient_name=recipient_name,
            address=job.delivery_location or "Destination Delivery Point",
            status="delivered",
            delivered_at=datetime.now(timezone.utc),
            notes=delivery_notes,
        )
        db.add(delivery)

    # Audit Log 1: Chain of custody completion
    db.add(AuditLog(
        job_id=job.id,
        user_id=current_user["id"],
        action="job_delivered",
        details=f"DELIVERY COMPLETED: Unloaded and verified {verified_count} boxes. Handover to {recipient_name}. Notes: {delivery_notes}.",
    ))

    # Audit Log 2: Formal notification dispatched to Company
    driver_name = current_user.get("full_name") or "Driver"
    db.add(AuditLog(
        job_id=job.id,
        user_id=current_user["id"],
        action="company_notification",
        details=f"🔔 Delivery Notification to {getattr(job.company, 'name', 'Company') if job.company else 'Company'}: Cargo for '{job.job_name}' has been delivered at {job.delivery_location or 'destination'} by {driver_name}. Verified with delivery checklist.",
    ))

    db.commit()
    return {
        "message": f"Job completed! Cargo successfully delivered and verified with {recipient_name}. Company has been notified.",
        "status": job.status,
        "recipient_name": recipient_name,
        "verified_count": verified_count,
    }


class BundleJobRequest(BaseModel):
    bundle_job_id: str


@router.get("/{job_id}/bundle-candidates")
def get_bundle_candidates(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """List available jobs that can be combined into this truck before starting trip."""
    if current_user["user_type"] not in ("trucker", "admin"):
        raise HTTPException(status_code=403, detail="Trucker account required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Available candidates: any open jobs (draft, posted, matched) or accepted jobs not yet on this truck and not in transit/delivered
    query = (
        db.query(Job)
        .filter(
            Job.id != job_id,
            Job.status.in_(["draft", "posted", "matched", "accepted", "loading"]),
        )
    )
    if job.truck_id:
        query = query.filter(
            (Job.truck_id != job.truck_id)
            | (Job.truck_id.is_(None))
            | (Job.packing_data.is_(None))
            | (Job.packing_data == "")
        )
    candidates = query.all()

    results = []
    for c in candidates:
        boxes = db.query(Box).filter(Box.job_id == c.id).all()
        box_count = len(boxes)
        total_weight = sum(b.weight_kg for b in boxes)
        results.append({
            "id": c.id,
            "job_name": c.job_name,
            "pickup_location": c.pickup_location,
            "delivery_location": c.delivery_location,
            "date": str(c.date),
            "time_window": c.time_window,
            "box_count": box_count,
            "total_weight_kg": round(total_weight, 2),
            "status": c.status,
            "company_name": getattr(c.company, "name", None) if c.company else None,
        })
    # Sort candidates so jobs with boxes appear first
    results.sort(key=lambda x: x["box_count"], reverse=True)
    return results


@router.get("/{job_id}/bundled-jobs")
def get_bundled_jobs(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get all active jobs currently sharing this truck trip."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.truck_id:
        return []

    truck_jobs = (
        db.query(Job)
        .filter(
            Job.truck_id == job.truck_id,
            Job.status.in_(["accepted", "loading", "in_transit"]),
        )
        .all()
    )

    results = []
    for tj in truck_jobs:
        boxes = db.query(Box).filter(Box.job_id == tj.id).all()
        results.append({
            "id": tj.id,
            "job_name": tj.job_name,
            "status": tj.status,
            "box_count": len(boxes),
            "total_weight_kg": round(sum(b.weight_kg for b in boxes), 2),
            "pickup_location": tj.pickup_location,
            "delivery_location": tj.delivery_location,
            "is_current": tj.id == job.id,
            "has_3d_packing": bool(tj.packing_data),
        })
    return results


@router.post("/{job_id}/bundle-job")
def bundle_job_to_trip(
    job_id: str,
    data: BundleJobRequest,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Combine another available job to this truck trip and 3D pack its boxes alongside previous boxes."""
    if current_user["user_type"] not in ("trucker", "admin"):
        raise HTTPException(status_code=403, detail="Only truckers can consolidate jobs into their truck")

    current_job = db.query(Job).filter(Job.id == job_id).first()
    if not current_job:
        raise HTTPException(status_code=404, detail="Primary job not found")

    if not current_job.truck_id:
        raise HTTPException(status_code=400, detail="Primary job has no truck assigned yet")

    if current_job.status not in ("accepted", "loading"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add jobs after trip has started. Current status is '{current_job.status}'.",
        )

    bundle_job = db.query(Job).filter(Job.id == data.bundle_job_id).first()
    if not bundle_job:
        raise HTTPException(status_code=404, detail="Job to bundle not found")

    if bundle_job.status not in ("draft", "posted", "matched", "accepted", "loading"):
        raise HTTPException(
            status_code=400,
            detail=f"Target job cannot be added in '{bundle_job.status}' status.",
        )

    truck = db.query(Truck).filter(Truck.id == current_job.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Assigned truck not found")

    # Assign target job to the same truck
    bundle_job.truck_id = current_job.truck_id
    bundle_job.status = "accepted"

    db.add(AuditLog(
        job_id=bundle_job.id,
        user_id=current_user["id"],
        action="job_bundled",
        details=f"Consolidated into truck {truck.plate_number} alongside '{current_job.job_name}'",
    ))
    db.commit()

    # Now compute 3D packing so previous boxes and newly added boxes are positioned together
    from app.services.bin_packing import pack_boxes_3d

    current_boxes = db.query(Box).filter(Box.job_id == current_job.id).all()
    bundle_boxes = db.query(Box).filter(Box.job_id == bundle_job.id).all()

    truck_dims = {
        "length": truck.length_cm,
        "width": truck.width_cm,
        "height": truck.height_cm,
        "max_weight": truck.max_weight_kg,
    }

    # 1. If current job has not been packed yet, pack it first
    existing_placements = []
    has_packed_current = any(b.pack_x is not None for b in current_boxes)

    if not has_packed_current and current_boxes:
        box_list_cur = [
            {
                "id": box.id,
                "label": box.label_reference,
                "length": box.length_cm,
                "width": box.width_cm,
                "height": box.height_cm,
                "weight": box.weight_kg,
                "stop_order": box.stop_order,
                "fragile": box.fragile,
                "job_id": current_job.id,
                "job_name": current_job.job_name,
                "is_previous_job": False,
            }
            for box in current_boxes
        ]
        res_cur = pack_boxes_3d(truck_dims, box_list_cur)
        for p in res_cur["placements"]:
            bx = db.query(Box).filter(Box.id == p["id"]).first()
            if bx:
                bx.pack_x = p["x"]
                bx.pack_y = p["y"]
                bx.pack_z = p["z"]
                bx.pack_rotation = p["rotation"]
        current_job.packing_data = json.dumps(res_cur)
        current_job.status = "loading"
        db.commit()

    # 2. Gather all existing placed boxes on this truck (from current_job and any other prior jobs)
    other_jobs_on_truck = db.query(Job).filter(
        Job.truck_id == truck.id,
        Job.id != bundle_job.id,
        Job.status.in_(["accepted", "loading", "in_transit"]),
    ).all()

    existing_placements = []
    for oj in other_jobs_on_truck:
        oj_boxes = db.query(Box).filter(Box.job_id == oj.id).all()
        for b in oj_boxes:
            if b.pack_x is not None and b.pack_y is not None and b.pack_z is not None:
                existing_placements.append({
                    "id": b.id,
                    "label": b.label_reference,
                    "x": b.pack_x,
                    "y": b.pack_y,
                    "z": b.pack_z,
                    "length": b.length_cm,
                    "width": b.width_cm,
                    "height": b.height_cm,
                    "weight": b.weight_kg,
                    "rotation": b.pack_rotation or 0,
                    "stop_order": b.stop_order,
                    "fragile": b.fragile,
                    "job_id": oj.id,
                    "job_name": oj.job_name,
                    "is_previous_job": True,
                })

    # 3. Pack bundle_job's boxes into remaining space
    if bundle_boxes:
        box_list_bundle = [
            {
                "id": box.id,
                "label": box.label_reference,
                "length": box.length_cm,
                "width": box.width_cm,
                "height": box.height_cm,
                "weight": box.weight_kg,
                "stop_order": box.stop_order,
                "fragile": box.fragile,
                "job_id": bundle_job.id,
                "job_name": bundle_job.job_name,
                "is_previous_job": False,
            }
            for box in bundle_boxes
        ]
        res_bundle = pack_boxes_3d(truck_dims, box_list_bundle, existing_placements=existing_placements)
        for p in res_bundle["placements"]:
            bx = db.query(Box).filter(Box.id == p["id"]).first()
            if bx:
                bx.pack_x = p["x"]
                bx.pack_y = p["y"]
                bx.pack_z = p["z"]
                bx.pack_rotation = p["rotation"]
        bundle_job.packing_data = json.dumps(res_bundle)
        bundle_job.status = "loading"

        # Also update current_job's packing_data so its 3D viewer immediately displays the newly placed bundled boxes!
        if current_job.packing_data:
            try:
                cur_pack = json.loads(current_job.packing_data)
                new_prev = cur_pack.get("previous_placements", [])
                new_prev = [p for p in new_prev if p.get("job_id") != bundle_job.id]
                for p in res_bundle["placements"]:
                    new_prev.append({
                        **p,
                        "job_id": bundle_job.id,
                        "job_name": bundle_job.job_name,
                        "is_previous_job": True,
                    })
                cur_pack["previous_placements"] = new_prev
                current_job.packing_data = json.dumps(cur_pack)
            except Exception:
                pass

        db.commit()

    return {
        "message": f"Job '{bundle_job.job_name}' ({len(bundle_boxes)} boxes) successfully added to truck! 3D container packing updated with previous boxes.",
        "primary_job_id": current_job.id,
        "bundled_job_id": bundle_job.id,
        "truck_plate": truck.plate_number,
        "existing_boxes_count": len(existing_placements),
        "new_boxes_count": len(bundle_boxes),
    }

