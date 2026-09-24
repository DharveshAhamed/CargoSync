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
from app.schemas.company import CompanyResponse, CompanyUpdate
from app.schemas.admin import AdminUserCreate, AdminCompanyCreate, UserResponse, AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/companies", response_model=List[CompanyResponse])
def list_all_companies(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all registered companies."""
    companies = db.query(Company).order_by(Company.created_at.desc()).all()
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
