"""
CargoSync — Box/cargo management API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.box import Box
from app.models.job import Job
from app.schemas.box import BoxCreate, BoxUpdate, BoxResponse
from app.services.access import get_job_or_404

router = APIRouter(prefix="/boxes", tags=["Boxes"])


@router.get("/job/{job_id}", response_model=List[BoxResponse])
def list_boxes_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all boxes for a specific job."""
    job = get_job_or_404(job_id, current_user, db)

    boxes = db.query(Box).filter(Box.job_id == job_id).order_by(Box.stop_order).all()
    return boxes


@router.post("/", response_model=BoxResponse, status_code=status.HTTP_201_CREATED)
def create_box(
    data: BoxCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new box to a job (company only)."""
    if current_user.get("user_type") not in ("company", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company/shipper accounts can add cargo boxes to a job",
        )

    job = get_job_or_404(data.job_id, current_user, db)

    box = Box(**data.model_dump())
    db.add(box)
    db.commit()
    db.refresh(box)
    return box


@router.put("/{box_id}", response_model=BoxResponse)
def update_box(
    box_id: str,
    data: BoxUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a box's details."""
    if current_user.get("user_type") not in ("company", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company/shipper accounts can update cargo boxes",
        )

    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    # Verify ownership / access
    get_job_or_404(box.job_id, current_user, db)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(box, key, value)

    db.commit()
    db.refresh(box)
    return box


@router.delete("/{box_id}")
def delete_box(
    box_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a box (company only)."""
    if current_user.get("user_type") not in ("company", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company/shipper accounts can delete cargo boxes",
        )

    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    # Verify ownership / access
    get_job_or_404(box.job_id, current_user, db)

    db.delete(box)
    db.commit()
    return {"message": "Box deleted successfully"}
