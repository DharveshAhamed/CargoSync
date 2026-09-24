"""
CargoSync — Audit log / chain of custody API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_company_user
from app.models.audit_log import AuditLog
from app.models.job import Job
from app.schemas.admin import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("/job/{job_id}", response_model=List[AuditLogResponse])
def get_audit_log_for_job(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get the complete chain of custody audit log for a job."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.job_id == job_id)
        .order_by(AuditLog.scanned_at.desc())
        .all()
    )
    return logs


@router.get("/box/{box_id}", response_model=List[AuditLogResponse])
def get_audit_log_for_box(
    box_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get the chain of custody audit log for a specific box."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.box_id == box_id)
        .order_by(AuditLog.scanned_at.desc())
        .all()
    )
    return logs


@router.get("/tamper-alerts/{job_id}")
def get_tamper_alerts(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Get tamper detection alerts for a job."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    alerts = (
        db.query(AuditLog)
        .filter(AuditLog.job_id == job_id, AuditLog.action == "tamper_detected")
        .order_by(AuditLog.scanned_at.desc())
        .all()
    )
    return {
        "job_id": job_id,
        "alert_count": len(alerts),
        "alerts": [
            AuditLogResponse(
                id=a.id,
                job_id=a.job_id,
                box_id=a.box_id,
                user_id=a.user_id,
                action=a.action,
                details=a.details,
                gps_lat=a.gps_lat,
                gps_lng=a.gps_lng,
                scanned_at=a.scanned_at,
            )
            for a in alerts
        ],
    }
