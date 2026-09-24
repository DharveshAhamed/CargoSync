"""
CargoSync — 3D Bin Packing API routes
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_company_user
from app.models.job import Job
from app.models.box import Box
from app.models.truck import Truck
from app.services.bin_packing import pack_boxes_3d
from app.services.pdf_service import generate_loading_sheet

router = APIRouter(prefix="/packing", tags=["Packing"])


@router.post("/compute/{job_id}")
def compute_packing(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Run the 3D bin packing algorithm for a job."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.truck_id:
        raise HTTPException(status_code=400, detail="No truck assigned to this job")

    truck = db.query(Truck).filter(Truck.id == job.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order.desc()).all()
    if not boxes:
        raise HTTPException(status_code=400, detail="No boxes found for this job")

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
        }
        for box in boxes
    ]

    result = pack_boxes_3d(truck_dims, box_list)

    # Update box placements in database
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
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Generate and download a PDF loading order sheet."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    truck = db.query(Truck).filter(Truck.id == job.truck_id).first() if job.truck_id else None
    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order.desc()).all()

    # Generate PDF
    pdf_buffer = generate_loading_sheet(job, truck, boxes)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=loading_sheet_{job.job_name}.pdf"},
    )
