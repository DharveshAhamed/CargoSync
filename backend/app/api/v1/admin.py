"""
CargoSync — Admin management API routes
Admin can manage companies and users platform-wide
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, require_admin
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User
from app.models.admin import Admin
from app.models.job import Job
from app.models.truck import Truck
from app.models.driver import Driver
from app.models.audit_log import AuditLog
from app.schemas.company import CompanyResponse, CompanyUpdate
from app.schemas.admin import AdminUserCreate, AdminCompanyCreate, UserResponse, AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/companies", response_model=List[CompanyResponse])
def list_all_companies(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all registered companies."""
    companies = db.query(Company).filter(Company.account_type == "company").order_by(Company.created_at.desc()).all()
    return companies


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    data: AdminCompanyCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new company (admin only)."""
    existing = db.query(Company).filter(Company.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company email already registered")

    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: str,
    data: CompanyUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a company's details."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    company_id: str = None,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users, optionally filtered by company."""
    query = db.query(User)
    if company_id:
        query = query.filter(User.company_id == company_id)
    users = query.order_by(User.created_at.desc()).all()
    return users


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminUserCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new user in a company (admin only)."""
    company = db.query(Company).filter(Company.id == data.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        company_id=data.company_id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/dashboard")
def admin_dashboard(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get admin dashboard statistics."""
    from app.models.job import Job
    from app.models.truck import Truck

    return {
        "total_companies": db.query(Company).count(),
        "total_users": db.query(User).count(),
        "total_trucks": db.query(Truck).count(),
        "total_jobs": db.query(Job).count(),
        "active_jobs": db.query(Job).filter(Job.status.in_(["in_transit", "out_for_delivery", "loading"])).count(),
        "completed_jobs": db.query(Job).filter(Job.status == "delivered").count(),
    }


@router.get("/truckers")
def list_truckers(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    truckers = db.query(Company).filter(Company.account_type == "trucker").order_by(Company.created_at.desc()).all()
    return [{"id": t.id, "name": t.name, "email": t.email, "phone": t.phone, "address": t.address,
             "created_at": t.created_at,
             "truck_count": db.query(Truck).filter(Truck.company_id == t.id).count(),
             "driver_count": db.query(Driver).filter(Driver.company_id == t.id).count()} for t in truckers]


@router.get("/truckers/{trucker_id}")
def get_trucker_details(trucker_id: str, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    trucker = db.query(Company).filter(Company.id == trucker_id, Company.account_type == "trucker").first()
    if not trucker:
        raise HTTPException(status_code=404, detail="Trucker not found")
    trucks = db.query(Truck).filter(Truck.company_id == trucker.id).all()
    drivers = db.query(Driver).filter(Driver.company_id == trucker.id).all()
    return {"id": trucker.id, "name": trucker.name, "email": trucker.email, "phone": trucker.phone,
            "address": trucker.address,
            "trucks": [{"id": t.id, "truck_name": t.truck_name, "plate_number": t.plate_number,
                        "max_weight_kg": t.max_weight_kg, "is_active": t.is_active} for t in trucks],
            "drivers": [{"id": d.id, "name": d.name, "phone": d.phone,
                         "license_number": d.license_number, "is_active": d.is_active} for d in drivers]}


@router.get("/jobs")
def list_all_jobs(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    jobs = db.query(Job, Company).join(Company, Company.id == Job.company_id).order_by(Job.created_at.desc()).all()
    return [{"id": job.id, "job_name": job.job_name, "status": job.status, "date": job.date,
             "company_name": company.name, "truck_id": job.truck_id,
             "pickup_location": job.pickup_location, "delivery_location": job.delivery_location} for job, company in jobs]


@router.get("/logs")
def list_all_logs(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.scanned_at.desc()).limit(500).all()
    return logs
