"""
CargoSync — Driver management API routes

Full CRUD for drivers + link/unlink driver to truck.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_trucker
from app.models.driver import Driver
from app.models.truck import Truck
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse

router = APIRouter(prefix="/drivers", tags=["Drivers"])


def _driver_to_response(driver: Driver) -> dict:
    """Convert a Driver ORM object to a response dict with truck info."""
    data = {
        "id": driver.id,
        "company_id": driver.company_id,
        "name": driver.name,
        "email": driver.email,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "license_expiry": driver.license_expiry,
        "notes": driver.notes,
        "is_active": driver.is_active,
        "created_at": driver.created_at,
        "truck_plate": driver.truck.plate_number if driver.truck else None,
    }
    return data


@router.get("/", response_model=List[DriverResponse])
def list_drivers(
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """List all drivers for the current company."""
    drivers = (
        db.query(Driver)
        .filter(Driver.company_id == current_user["company_id"])
        .order_by(Driver.created_at.desc())
        .all()
    )
    return [_driver_to_response(d) for d in drivers]


@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    data: DriverCreate,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Add a new driver."""
    driver = Driver(
        company_id=current_user["company_id"],
        **data.model_dump(),
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return _driver_to_response(driver)


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Get a specific driver by ID."""
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.company_id == current_user["company_id"])
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return _driver_to_response(driver)


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: str,
    data: DriverUpdate,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Update a driver's details."""
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.company_id == current_user["company_id"])
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return _driver_to_response(driver)


@router.delete("/{driver_id}")
def deactivate_driver(
    driver_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Soft-delete (deactivate) a driver."""
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.company_id == current_user["company_id"])
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver.is_active = False

    # Unlink from truck if assigned
    if driver.truck:
        driver.truck.driver_id = None

    db.commit()
    return {"message": "Driver deactivated successfully"}


@router.post("/{driver_id}/assign/{truck_id}")
def assign_driver_to_truck(
    driver_id: str,
    truck_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Assign a driver to a truck. Unlinks from any previous truck."""
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.company_id == current_user["company_id"])
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    truck = (
        db.query(Truck)
        .filter(Truck.id == truck_id, Truck.company_id == current_user["company_id"])
        .first()
    )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    # Unlink driver from any previously assigned truck
    if driver.truck and driver.truck.id != truck_id:
        driver.truck.driver_id = None

    # Unlink any other driver currently on this truck
    if truck.driver_id and truck.driver_id != driver_id:
        pass  # The FK update below handles it

    truck.driver_id = driver.id
    db.commit()
    db.refresh(driver)
    return {"message": f"Driver {driver.name} assigned to {truck.truck_name} ({truck.plate_number})"}


@router.post("/{driver_id}/unassign")
def unassign_driver(
    driver_id: str,
    current_user: dict = Depends(require_trucker),
    db: Session = Depends(get_db),
):
    """Remove a driver from their assigned truck."""
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.company_id == current_user["company_id"])
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if driver.truck:
        driver.truck.driver_id = None
        db.commit()
        return {"message": f"Driver {driver.name} unassigned"}
    return {"message": "Driver was not assigned to any truck"}
