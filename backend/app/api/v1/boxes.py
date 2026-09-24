"""
CargoSync — Box/cargo management API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_company_user
from app.models.box import Box
from app.models.job import Job
from app.schemas.box import BoxCreate, BoxUpdate, BoxResponse

router = APIRouter(prefix="/boxes", tags=["Boxes"])


@router.get("/job/{job_id}", response_model=List[BoxResponse])
def list_boxes_for_job(
    job_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """List all boxes for a specific job."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order).all()
    return boxes


@router.post("/", response_model=BoxResponse, status_code=status.HTTP_201_CREATED)
def create_box(
    data: BoxCreate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Add a new box to a job."""
    job = (
        db.query(Job)
        .filter(Job.id == data.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    box = Box(**data.model_dump())
    db.add(box)
    db.commit()
    db.refresh(box)
    return box


@router.put("/{box_id}", response_model=BoxResponse)
def update_box(
    box_id: str,
    data: BoxUpdate,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Update a box's details."""
    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    # Verify ownership
    job = (
        db.query(Job)
        .filter(Job.id == box.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(box, key, value)

    db.commit()
    db.refresh(box)
    return box


@router.delete("/{box_id}")
def delete_box(
    box_id: str,
    current_user: dict = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    """Delete a box."""
    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    job = (
        db.query(Job)
        .filter(Job.id == box.job_id, Job.company_id == current_user["company_id"])
        .first()
    )
    if not job:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(box)
    db.commit()
    return {"message": "Box deleted successfully"}
