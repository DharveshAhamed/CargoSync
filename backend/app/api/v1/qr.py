"""
CargoSync — QR code generation API routes
"""

import json
import io
import base64
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.box import Box
from app.models.job import Job
from app.models.audit_log import AuditLog
from app.services.qr_service import generate_qr_code_svg, generate_qr_data
from app.services.access import get_job_or_404

router = APIRouter(prefix="/qr", tags=["QR Codes"])


@router.post("/generate/{job_id}")
def generate_qr_codes_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate QR codes for all boxes in a job."""
    job = get_job_or_404(job_id, current_user, db)

    boxes = db.query(Box).filter(Box.job_id == job_id).all()
    if not boxes:
        raise HTTPException(status_code=400, detail="No boxes found for this job")

    results = []
    for box in boxes:
        qr_data = generate_qr_data(box, job)
        box.qr_code = qr_data
        svg = generate_qr_code_svg(qr_data, box.label_reference)
        results.append({
            "box_id": box.id,
            "label": box.label_reference,
            "qr_data": qr_data,
            "svg": svg,
        })

        # Audit log
        audit = AuditLog(
            job_id=job_id,
            box_id=box.id,
            user_id=current_user["id"],
            action="qr_generated",
            details=f"QR code generated for box {box.label_reference}",
        )
        db.add(audit)

    db.commit()
    return {"message": f"Generated QR codes for {len(results)} boxes", "boxes": results}


@router.get("/label/{box_id}")
def get_qr_label(
    box_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a printable QR label for a specific box."""
    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    job = get_job_or_404(box.job_id, current_user, db)

    qr_data = box.qr_code or generate_qr_data(box, job)
    svg_content = generate_qr_code_svg(qr_data, box.label_reference)

    return StreamingResponse(
        io.BytesIO(svg_content.encode()),
        media_type="image/svg+xml",
        headers={"Content-Disposition": f"inline; filename=qr_{box.label_reference}.svg"},
    )


@router.get("/labels/{job_id}")
def get_all_labels_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all QR labels for a job as SVG data."""
    job = get_job_or_404(job_id, current_user, db)

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order).all()
    labels = []
    for box in boxes:
        qr_data = box.qr_code or generate_qr_data(box, job)
        svg = generate_qr_code_svg(qr_data, box.label_reference)
        labels.append({
            "box_id": box.id,
            "label": box.label_reference,
            "stop_order": box.stop_order,
            "svg": svg,
        })

    return {"job_name": job.job_name, "labels": labels}
