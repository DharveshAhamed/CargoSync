"""
CargoSync — 3D Bin Packing API routes
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.job import Job
from app.models.box import Box
from app.models.truck import Truck
from app.services.bin_packing import pack_boxes_3d
from app.services.pdf_service import generate_loading_sheet
from app.services.access import get_job_or_404

router = APIRouter(prefix="/packing", tags=["Packing"])


@router.post("/compute/{job_id}")
def compute_packing(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run the 3D bin packing algorithm for a job (trucker only, accounting for active truck cargo)."""
    # Restrict 3D packing execution to truckers (and admin)
    if current_user.get("user_type") not in ("trucker", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Only truckers can pack boxes and compute 3D bin packing",
        )

    job = get_job_or_404(job_id, current_user, db)

    if not job.truck_id:
        raise HTTPException(status_code=400, detail="No truck assigned to this job")

    truck = db.query(Truck).filter(Truck.id == job.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order.desc()).all()
    if not boxes:
        raise HTTPException(status_code=400, detail="No boxes found for this job")

    # Find other active jobs assigned to this truck (accepted, loading, or in_transit)
    other_active_jobs = db.query(Job).filter(
        Job.truck_id == truck.id,
        Job.id != job.id,
        Job.status.in_(["accepted", "loading", "in_transit"]),
    ).all()

    existing_placements = []
    for other_job in other_active_jobs:
        other_boxes = db.query(Box).filter(Box.job_id == other_job.id).all()
        for b in other_boxes:
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
                    "job_id": other_job.id,
                    "job_name": other_job.job_name,
                    "is_previous_job": True,
                })

    # Run 3D bin packing
    truck_dims = {
        "length": truck.length_cm,
        "width": truck.width_cm,
        "height": truck.height_cm,
        "max_weight": truck.max_weight_kg,
    }

    box_list = [
        {
            "id": box.id,
            "label": box.label_reference,
            "length": box.length_cm,
            "width": box.width_cm,
            "height": box.height_cm,
            "weight": box.weight_kg,
            "stop_order": box.stop_order,
            "fragile": box.fragile,
            "job_id": job.id,
            "job_name": job.job_name,
            "is_previous_job": False,
        }
        for box in boxes
    ]

    result = pack_boxes_3d(truck_dims, box_list, existing_placements=existing_placements)

    # Update box placements in database for current job
    for placement in result["placements"]:
        box = db.query(Box).filter(Box.id == placement["id"]).first()
        if box:
            box.pack_x = placement["x"]
            box.pack_y = placement["y"]
            box.pack_z = placement["z"]
            box.pack_rotation = placement["rotation"]

    # Store packing data on job
    job.packing_data = json.dumps(result)
    db.commit()

    return result


@router.get("/loading-sheet/{job_id}")
def get_loading_sheet(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and download a PDF loading order sheet."""
    job = get_job_or_404(job_id, current_user, db)

    truck = db.query(Truck).filter(Truck.id == job.truck_id).first() if job.truck_id else None
    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order.desc()).all()

    # Generate PDF
    pdf_buffer = generate_loading_sheet(job, truck, boxes)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=loading_sheet_{job.job_name}.pdf"},
    )
