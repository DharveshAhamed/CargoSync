"""
CargoSync — Delivery management API routes
Handles multi-stop deliveries and proof of delivery
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_company_user
from app.models.delivery import Delivery
from app.models.job import Job
from app.models.audit_log import AuditLog
from app.schemas.delivery import DeliveryCreate, DeliveryUpdate, DeliveryResponse, PODSubmit

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get("/job/{job_id}", response_model=List[DeliveryResponse])
def list_deliveries_for_job(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """List all delivery stops for a job."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    deliveries = (
        db.query(Delivery)
        .filter(Delivery.job_id == job_id)
        .order_by(Delivery.stop_order)
        .all()
    )
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
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Submit proof of delivery (signature, photo, GPS, notes)."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

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
