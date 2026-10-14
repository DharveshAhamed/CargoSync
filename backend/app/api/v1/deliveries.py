"""
CargoSync — Delivery management API routes
Handles multi-stop deliveries and proof of delivery
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user, require_company_user
from app.models.delivery import Delivery
from app.models.job import Job
from app.models.audit_log import AuditLog
from app.models.truck import Truck
from app.schemas.delivery import DeliveryCreate, DeliveryUpdate, DeliveryResponse, PODSubmit
from app.services.access import get_job_or_404

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get("/job/{job_id}", response_model=List[DeliveryResponse])
def list_deliveries_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all delivery stops for a job. Auto-creates primary stop if not present."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Ownership check
    if current_user.get("user_type") == "company" and job.company_id != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    deliveries = (
        db.query(Delivery)
        .filter(Delivery.job_id == job_id)
        .order_by(Delivery.stop_order)
        .all()
    )

    # Auto-populate primary delivery stop from job if none exists
    if not deliveries:
        recipient = (getattr(job.company, "name", None) if job.company else None) or "Consignee / Receiver"
        address = job.delivery_location or "Destination Delivery Point"
        delivery_status = "delivered" if job.status == "delivered" else ("in_transit" if job.status in ("in_transit", "out_for_delivery") else "pending")
        
        default_delivery = Delivery(
            job_id=job.id,
            stop_order=1,
            recipient_name=recipient,
            address=address,
            status=delivery_status,
            delivered_at=datetime.now(timezone.utc) if job.status == "delivered" else None,
            notes=f"Delivery point for {job.job_name}"
        )
        db.add(default_delivery)
        db.commit()
        db.refresh(default_delivery)
        deliveries = [default_delivery]

    return deliveries


@router.post("/", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_delivery(
    data: DeliveryCreate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Add a new delivery stop to a job."""
    job = (
        db.query(Job)
        .filter(Job.id == data.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    delivery = Delivery(**data.model_dump())
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.put("/{delivery_id}", response_model=DeliveryResponse)
def update_delivery(
    delivery_id: str,
    data: DeliveryUpdate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Update a delivery stop."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    job = (
        db.query(Job)
        .filter(Job.id == delivery.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(delivery, key, value)

    db.commit()
    db.refresh(delivery)
    return delivery


@router.post("/{delivery_id}/pod", response_model=DeliveryResponse)
def submit_proof_of_delivery(
    delivery_id: str,
    data: PODSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit proof of delivery (signature, photo, GPS, notes)."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    job = db.query(Job).filter(Job.id == delivery.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Update POD fields
    if data.signature_url:
        delivery.signature_url = data.signature_url
    if data.photo_url:
        delivery.photo_url = data.photo_url
    if data.gps_lat is not None:
        delivery.gps_lat = data.gps_lat
    if data.gps_lng is not None:
        delivery.gps_lng = data.gps_lng
    if data.notes:
        delivery.notes = data.notes

    delivery.status = "delivered"
    delivery.delivered_at = datetime.now(timezone.utc)

    # Create audit log entry
    audit = AuditLog(
        job_id=delivery.job_id,
        box_id=delivery.box_id,
        user_id=current_user["id"],
        action="pod_submitted",
        details=f"POD submitted for delivery {delivery_id}",
        gps_lat=data.gps_lat,
        gps_lng=data.gps_lng,
    )
    db.add(audit)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.delete("/{delivery_id}")
def delete_delivery(
    delivery_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Delete a delivery stop."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    job = (
        db.query(Job)
        .filter(Job.id == delivery.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(delivery)
    db.commit()
    return {"message": "Delivery stop deleted successfully"}
