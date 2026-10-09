"""
CargoSync — Scanning & manifest validation API routes
"""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.deps import get_db, require_company_user
from app.models.box import Box
from app.models.job import Job
from app.models.delivery import Delivery
from app.models.audit_log import AuditLog
from app.models.truck import Truck

router = APIRouter(prefix="/scanning", tags=["Scanning"])


class ScanRequest(BaseModel):
    qr_data: str
    scan_type: str  # "loading", "delivery", "transit"
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None


class ManifestItem(BaseModel):
    box_id: str
    label: str
    scanned: bool
    stop_order: int


@router.post("/validate")
def validate_scan(
    data: ScanRequest,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Validate a QR code scan during loading or delivery."""
    try:
        qr_info = json.loads(data.qr_data)
        box_id = qr_info.get("box_id")
        job_id = qr_info.get("job_id")
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid QR code format")

    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    truck_owned = job.truck_id and db.query(Truck).filter(
        Truck.id == job.truck_id, Truck.company_id == current_user["company_id"]
    ).first()
    if job.company_id != current_user["company_id"] and not truck_owned:
        raise HTTPException(status_code=403, detail="This job is not assigned to your account")
    if current_user["user_type"] == "company" and data.scan_type != "loading":
        raise HTTPException(status_code=403, detail="Companies can only record loading scans")
    if current_user["user_type"] == "trucker" and data.scan_type not in ("delivery", "transit"):
        raise HTTPException(status_code=403, detail="Truckers can only record transit or unloading scans")

    # Record the scan in audit log
    action = f"{data.scan_type}_scanned"
    audit = AuditLog(
        job_id=job_id,
        box_id=box_id,
        user_id=current_user["id"],
        action=action,
        details=json.dumps({
            "scan_type": data.scan_type,
            "label": box.label_reference,
        }),
        gps_lat=data.gps_lat,
        gps_lng=data.gps_lng,
    )
    db.add(audit)

    # Handle specific scan types
    result = {"valid": True, "box_label": box.label_reference, "scan_type": data.scan_type}

    if data.scan_type == "loading":
        # Check if this box belongs to the right job
        if box.job_id != job_id:
            result["valid"] = False
            result["error"] = "Box does not belong to this job"
        else:
            result["message"] = f"Box '{box.label_reference}' verified for loading"

    elif data.scan_type == "delivery":
        # Check delivery stop
        delivery = db.query(Delivery).filter(Delivery.box_id == box_id).first()
        if delivery:
            result["stop_order"] = delivery.stop_order
            result["recipient"] = delivery.recipient_name
            result["message"] = f"Box for stop #{delivery.stop_order}: {delivery.recipient_name}"
        else:
            result["message"] = f"Box '{box.label_reference}' scanned at delivery"

    elif data.scan_type == "transit":
        # Tamper monitoring — check if scan location is reasonable
        result["message"] = f"Transit scan recorded for box '{box.label_reference}'"
        # Flag if there are unexpected scans
        recent_scans = (
            db.query(AuditLog)
            .filter(AuditLog.box_id == box_id, AuditLog.action == "transit_scanned")
            .count()
        )
        if recent_scans > 10:
            result["warning"] = "Unusual number of transit scans detected"
            audit_tamper = AuditLog(
                job_id=job_id,
                box_id=box_id,
                user_id=current_user["id"],
                action="tamper_detected",
                details="Excessive transit scans detected",
                gps_lat=data.gps_lat,
                gps_lng=data.gps_lng,
            )
            db.add(audit_tamper)

    db.commit()
    return result


@router.get("/manifest/{job_id}")
def get_loading_manifest(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get the loading manifest for a job with scan status."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )
    truck_owned = job and job.truck_id and db.query(Truck).filter(
        Truck.id == job.truck_id, Truck.company_id == current_user["company_id"]
    ).first()
    if not job or (job.company_id != current_user["company_id"] and not truck_owned):
        raise HTTPException(status_code=404, detail="Job not found")

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order).all()

    manifest = []
    for box in boxes:
        # Check if this box has been scanned for loading
        scan = (
            db.query(AuditLog)
            .filter(
                AuditLog.box_id == box.id,
                AuditLog.action == "loading_scanned",
            )
            .first()
        )
        manifest.append({
            "box_id": box.id,
            "label": box.label_reference,
            "stop_order": box.stop_order,
            "weight_kg": box.weight_kg,
            "fragile": box.fragile,
            "hazard": box.hazard,
            "scanned": scan is not None,
            "scanned_at": str(scan.scanned_at) if scan else None,
        })

    total = len(manifest)
    scanned = sum(1 for m in manifest if m["scanned"])

    return {
        "job_id": job_id,
        "job_name": job.job_name,
        "total_boxes": total,
        "scanned_boxes": scanned,
        "all_scanned": total == scanned,
        "manifest": manifest,
    }
