"""
CargoSync — Authentication API routes
Handles: company registration, user/admin login, password reset, profile
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.company import Company
from app.models.user import User
from app.models.admin import Admin
from app.models.team_invite import TeamInvite
from app.schemas.auth import (
    CompanyRegisterRequest,
    TruckerRegisterRequest,
    AdminRegisterRequest,
    LoginRequest,
    TokenResponse,
    PasswordResetRequest,
    UserProfileResponse,
    TeamInviteRequest,
    TeamInviteResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _register_account(data: CompanyRegisterRequest, account_type: str, db: Session):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    company = Company(
        name=data.company_name, email=data.email, phone=data.phone,
        address=data.address, account_type=account_type,
    )
    db.add(company)
    db.flush()
    user = User(
        company_id=company.id, name=data.name, email=data.email,
        password_hash=hash_password(data.password), phone=data.phone,
        role="manager" if account_type == "company" else "trucker_owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_data = {"sub": user.id, "role": user.role, "user_type": account_type, "company_id": company.id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role,
              "company_id": company.id, "company_name": company.name, "user_type": account_type},
    )


def _login_account(data: LoginRequest, account_type: str, db: Session):
    user = db.query(User).filter(User.email == data.email).first()
    company = db.query(Company).filter(Company.id == user.company_id).first() if user else None
    if (not user or not company or company.account_type != account_type or
            not verify_password(data.password, user.password_hash)):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token_data = {"sub": user.id, "role": user.role, "user_type": account_type, "company_id": user.company_id}
    return TokenResponse(
        access_token=create_access_token(token_data), refresh_token=create_refresh_token(token_data),
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role,
              "company_id": user.company_id, "company_name": company.name, "user_type": account_type},
    )


@router.post("/register", response_model=TokenResponse)
def register_company(data: CompanyRegisterRequest, db: Session = Depends(get_db)):
    """Register a new company and create the first admin user."""
    return _register_account(data, "company", db)


@router.post("/company/register", response_model=TokenResponse)
def register_company_explicit(data: CompanyRegisterRequest, db: Session = Depends(get_db)):
    return _register_account(data, "company", db)


@router.post("/trucker/register", response_model=TokenResponse)
def register_trucker(data: TruckerRegisterRequest, db: Session = Depends(get_db)):
    return _register_account(data, "trucker", db)


@router.post("/login", response_model=TokenResponse)
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    """Login for company users."""
    return _login_account(data, "company", db)


@router.post("/company/login", response_model=TokenResponse)
def login_company(data: LoginRequest, db: Session = Depends(get_db)):
    return _login_account(data, "company", db)


@router.post("/trucker/login", response_model=TokenResponse)
def login_trucker(data: LoginRequest, db: Session = Depends(get_db)):
    return _login_account(data, "trucker", db)


@router.post("/admin/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_first_admin(data: AdminRegisterRequest, db: Session = Depends(get_db)):
    """Create the first platform administrator; disabled after initial setup."""
    if db.query(Admin).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Administrator setup is complete. Sign in with the existing admin account.",
        )
    admin = Admin(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="super_admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token_data = {"sub": admin.id, "role": admin.role, "user_type": "admin"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={"id": admin.id, "name": admin.name, "email": admin.email,
              "role": admin.role, "user_type": "admin"},
    )


@router.post("/admin/login", response_model=TokenResponse)
def login_admin(data: LoginRequest, db: Session = Depends(get_db)):
    """Login for platform administrators."""
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_data = {
        "sub": admin.id,
        "role": admin.role,
        "user_type": "admin",
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role,
            "user_type": "admin",
        },
    )


@router.get("/me", response_model=UserProfileResponse)
def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's profile."""
    if current_user["user_type"] == "admin":
        admin = db.query(Admin).filter(Admin.id == current_user["id"]).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        return UserProfileResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            role=admin.role,
            user_type="admin",
        )
    else:
        user = db.query(User).filter(User.id == current_user["id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        company = db.query(Company).filter(Company.id == user.company_id).first()
        return UserProfileResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            location=user.location,
            role=user.role,
            company_id=user.company_id,
            company_name=company.name if company else None,
            user_type=company.account_type if company else "company",
        )


@router.post("/password-reset")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request a password reset (creates a reset token)."""
    # Check in users table
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Check in admins table
        admin = db.query(Admin).filter(Admin.email == data.email).first()
        if not admin:
            # Don't reveal whether email exists
            return {"message": "If an account exists with this email, a reset link has been sent."}

    # In production, send reset email via Supabase Auth or SMTP
    # For now, return a success message
    return {"message": "If an account exists with this email, a reset link has been sent."}


@router.post("/invite")
def invite_team_member(
    data: TeamInviteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a team member to join the company."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Company membership required")

    # Check if already invited or registered
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")

    existing_invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.email == data.email,
            TeamInvite.company_id == current_user["company_id"],
            TeamInvite.status == "pending",
        )
        .first()
    )
    if existing_invite:
        raise HTTPException(status_code=400, detail="Invitation already pending")

    invite = TeamInvite(
        company_id=current_user["company_id"],
        email=data.email,
        role=data.role,
        token=str(uuid.uuid4()),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return {
        "message": f"Invitation sent to {data.email}",
        "invite_id": invite.id,
        "token": invite.token,
    }


@router.get("/invites", response_model=list[TeamInviteResponse])
def list_invites(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all pending invitations for the user's company."""
    if not current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Company membership required")

    invites = (
        db.query(TeamInvite)
        .filter(TeamInvite.company_id == current_user["company_id"])
        .order_by(TeamInvite.created_at.desc())
        .all()
    )
    return [
        TeamInviteResponse(
            id=inv.id,
            email=inv.email,
            role=inv.role,
            status=inv.status,
            created_at=str(inv.created_at),
            expires_at=str(inv.expires_at),
        )
        for inv in invites
    ]


@router.post("/accept-invite")
def accept_invite(token: str, data: CompanyRegisterRequest, db: Session = Depends(get_db)):
    """Accept a team invitation and create user account."""
    invite = (
        db.query(TeamInvite)
        .filter(TeamInvite.token == token, TeamInvite.status == "pending")
        .first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")

    user = User(
        company_id=invite.company_id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        phone=data.phone,
        role=invite.role,
    )
    db.add(user)

    invite.status = "accepted"
    db.commit()
    db.refresh(user)

    company = db.query(Company).filter(Company.id == invite.company_id).first()
    account_type = company.account_type if company else "company"

    token_data = {
        "sub": user.id,
        "role": user.role,
        "user_type": account_type,
        "company_id": invite.company_id,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": invite.company_id,
            "user_type": account_type,
        },
    )
