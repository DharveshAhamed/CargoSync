"""
CargoSync — Driver Loading & Unloading Checklist API routes
Allows drivers and truckers to inspect cargo, check off manifest items,
verify safety guidelines against 3D packing placement, and formally approve loading or delivery.
"""

import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.box import Box
from app.models.job import Job
from app.models.truck import Truck
from app.models.audit_log import AuditLog
from app.models.delivery import Delivery
from app.services.access import get_job_or_404

router = APIRouter(prefix="/checklist", tags=["Loading Checklist"])

DEFAULT_SAFETY_CHECKS = [
    "Cargo placed according to 3D packing sequence & reverse stop order",
    "Weight distributed evenly across truck axles within max capacity",
    "Fragile items secured on top layer without heavy overhead weight",
    "Hazardous cargo isolated, strapped, and properly labeled",
    "Load locks, tie-down straps, or cargo nets firmly fastened",
    "Container seal inspected and vehicle pre-trip check complete",
]


class ChecklistApprovalRequest(BaseModel):
    driver_name: str
    stage: str = "loading"  # "loading", "transit", "delivery"
    checked_box_ids: List[str]
    safety_checks: List[str] = []
    notes: Optional[str] = None
    advance_status: bool = True


class BoxToggleRequest(BaseModel):
    job_id: str
    box_id: str
    stage: str = "delivery"  # "loading", "transit", "delivery"
    checked: bool
    driver_name: Optional[str] = "Driver"
    notes: Optional[str] = None


@router.get("/{job_id}")
def get_loading_checklist(
    job_id: str,
    stage: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the cargo checklist, inspection state, and driver approval for a job."""
    job = get_job_or_404(job_id, current_user, db)

    truck = db.query(Truck).filter(Truck.id == job.truck_id).first() if job.truck_id else None
    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order).all()

    # Find the latest approval audit log for this job
    approval_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.job_id == job_id,
            AuditLog.action.in_(["loading_checklist_approved", "delivery_checklist_approved"]),
        )
        .order_by(AuditLog.scanned_at.desc())
        .first()
    )

    approval_data = None
    checked_ids_from_log = set()
    if approval_log and approval_log.details:
        try:
            parsed = json.loads(approval_log.details)
            approval_data = {
                "approved": True,
                "stage": parsed.get("stage", "loading"),
                "approved_by": parsed.get("driver_name", "Driver"),
                "approved_at": str(approval_log.scanned_at),
                "notes": parsed.get("notes"),
                "safety_checks": parsed.get("safety_checks", []),
                "checked_count": len(parsed.get("checked_box_ids", [])),
                "total_count": len(boxes),
            }
            checked_ids_from_log = set(parsed.get("checked_box_ids", []))
        except (json.JSONDecodeError, TypeError):
            pass

    # Find individually inspected / verified boxes
    inspected_box_ids = set()
    box_audit_logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.job_id == job_id,
            AuditLog.action.in_([
                "box_inspected",
                "loading_scanned",
                "delivery_scanned",
                "delivery_checked",
                "loading_checked",
                "transit_checked",
            ]),
        )
        .all()
    )
    for log in box_audit_logs:
        if log.box_id:
            inspected_box_ids.add(log.box_id)

    # Combine checked states
    all_checked_ids = checked_ids_from_log.union(inspected_box_ids)

    box_items = []
    for b in boxes:
        is_checked = (b.id in all_checked_ids) or (approval_data is not None and approval_data.get("approved"))
        # Get recipient if available
        delivery = db.query(Delivery).filter(Delivery.box_id == b.id).first()
        box_items.append({
            "id": b.id,
            "label_reference": b.label_reference,
            "length_cm": b.length_cm,
            "width_cm": b.width_cm,
            "height_cm": b.height_cm,
            "weight_kg": b.weight_kg,
            "stop_order": b.stop_order,
            "fragile": b.fragile,
            "hazard": b.hazard,
            "pack_x": b.pack_x,
            "pack_y": b.pack_y,
            "pack_z": b.pack_z,
            "pack_rotation": b.pack_rotation,
            "recipient_name": delivery.recipient_name if delivery else None,
            "delivery_address": delivery.address if delivery else None,
            "checked": is_checked,
        })

    # Recent activity logs for this job
    recent_logs = (
        db.query(AuditLog)
        .filter(AuditLog.job_id == job_id)
        .order_by(AuditLog.scanned_at.desc())
        .limit(8)
        .all()
    )
    recent_events = []
    for l in recent_logs:
        details_str = l.details or ""
        try:
            details_json = json.loads(details_str)
            label = details_json.get("label") or details_json.get("driver_name") or ""
        except:
            label = details_str
        recent_events.append({
            "id": l.id,
            "action": l.action,
            "label": label,
            "timestamp": str(l.scanned_at),
        })

    return {
        "job_id": job.id,
        "job_name": job.job_name,
        "status": job.status,
        "truck": {
            "name": truck.truck_name,
            "plate_number": truck.plate_number,
            "dimensions": f"{truck.length_cm}×{truck.width_cm}×{truck.height_cm} cm",
            "max_weight_kg": truck.max_weight_kg,
        } if truck else None,
        "total_boxes": len(boxes),
        "checked_boxes": sum(1 for b in box_items if b["checked"]),
        "default_safety_checks": DEFAULT_SAFETY_CHECKS,
        "approval": approval_data,
        "boxes": box_items,
        "recent_events": recent_events,
    }


@router.post("/toggle-box")
def toggle_box_status(
    data: BoxToggleRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle the verification status of a single cargo box."""
    job = get_job_or_404(data.job_id, current_user, db)
    box = db.query(Box).filter(Box.id == data.box_id, Box.job_id == data.job_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    action_name = f"{data.stage}_checked" if data.checked else f"{data.stage}_unchecked"

    audit = AuditLog(
        job_id=data.job_id,
        box_id=box.id,
        user_id=current_user.get("id"),
        action=action_name,
        details=json.dumps({
            "driver_name": data.driver_name or "Driver",
            "label": box.label_reference,
            "stop_order": box.stop_order,
            "notes": data.notes,
        }),
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "box_id": box.id,
        "checked": data.checked,
        "message": f"Box '{box.label_reference}' marked as {data.stage} {'checked' if data.checked else 'unchecked'}",
    }


@router.post("/approve/{job_id}")
def approve_loading_checklist(
    job_id: str,
    data: ChecklistApprovalRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Driver signs off and approves the loaded or unloaded cargo checklist for a job."""
    job = get_job_or_404(job_id, current_user, db)

    boxes = db.query(Box).filter(Box.job_id == job_id).all()
    if not boxes:
        raise HTTPException(status_code=400, detail="No cargo boxes found for this job")

    if not data.driver_name.strip():
        raise HTTPException(status_code=400, detail="Driver name is required for approval")

    # Record individual inspections in AuditLog
    for box_id in data.checked_box_ids:
        box = next((b for b in boxes if b.id == box_id), None)
        if box:
            audit_box = AuditLog(
                job_id=job_id,
                box_id=box.id,
                user_id=current_user.get("id"),
                action=f"{data.stage}_checked",
                details=json.dumps({
                    "driver_name": data.driver_name.strip(),
                    "label": box.label_reference,
                    "stop_order": box.stop_order,
                }),
            )
            db.add(audit_box)

    # Record overall loading checklist approval in AuditLog
    approval_action = (
        "delivery_checklist_approved" if data.stage == "delivery" else "loading_checklist_approved"
    )
    approval_details = {
        "stage": data.stage,
        "driver_name": data.driver_name.strip(),
        "checked_box_ids": data.checked_box_ids,
        "safety_checks": data.safety_checks,
        "notes": data.notes.strip() if data.notes else None,
        "total_boxes": len(boxes),
        "checked_count": len(data.checked_box_ids),
        "approved_at": datetime.now(timezone.utc).isoformat(),
    }

    audit_approval = AuditLog(
        job_id=job_id,
        user_id=current_user.get("id"),
        action=approval_action,
        details=json.dumps(approval_details),
    )
    db.add(audit_approval)

    # Advance status if appropriate
    if data.advance_status:
        if data.stage == "loading" and job.status == "accepted":
            job.status = "loading"
        elif data.stage == "delivery" and job.status in ["loading", "in_transit", "out_for_delivery"]:
            if len(data.checked_box_ids) == len(boxes):
                job.status = "delivered"
            else:
                job.status = "out_for_delivery"

    db.commit()

    return {
        "success": True,
        "message": f"Cargo checklist successfully approved by {data.driver_name.strip()} ({len(data.checked_box_ids)}/{len(boxes)} boxes verified for {data.stage})",
        "job_status": job.status,
        "approval": {
            "approved": True,
            "stage": data.stage,
            "approved_by": data.driver_name.strip(),
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "checked_count": len(data.checked_box_ids),
            "total_count": len(boxes),
        },
    }
