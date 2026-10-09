"""
CargoSync — Truck management API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_trucker
from app.models.truck import Truck
from app.schemas.truck import TruckCreate, TruckUpdate, TruckResponse

router = APIRouter(prefix="/trucks", tags=["Trucks"])


@router.get("/", response_model=List[TruckResponse])
def list_trucks(
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """List all trucks for the current company."""
    trucks = (
        db.query(Truck)
        .filter(Truck.company_id == current_user["company_id"])
        .order_by(Truck.created_at.desc())
        .all()
    )
    return trucks


@router.post("/", response_model=TruckResponse, status_code=status.HTTP_201_CREATED)
def create_truck(
    data: TruckCreate,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Add a new truck to the fleet."""
    # Check for duplicate plate number
    existing = db.query(Truck).filter(Truck.plate_number == data.plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plate number already registered")

    truck = Truck(
        company_id=current_user["company_id"],
        **data.model_dump(),
    )
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.get("/{truck_id}", response_model=TruckResponse)
def get_truck(
    truck_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Get a specific truck by ID."""
    truck = (
        db.query(Truck)
        .filter(Truck.id == truck_id, Truck.company_id == current_user["company_id"])
        .first()
    )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    return truck


@router.put("/{truck_id}", response_model=TruckResponse)
def update_truck(
    truck_id: str,
    data: TruckUpdate,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Update a truck's details."""
    truck = (
        db.query(Truck)
        .filter(Truck.id == truck_id, Truck.company_id == current_user["company_id"])
        .first()
    )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(truck, key, value)

    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}")
def deactivate_truck(
    truck_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Soft-delete (deactivate) a truck."""
    truck = (
        db.query(Truck)
        .filter(Truck.id == truck_id, Truck.company_id == current_user["company_id"])
        .first()
    )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    truck.is_active = False
    db.commit()
    return {"message": "Truck deactivated successfully"}
