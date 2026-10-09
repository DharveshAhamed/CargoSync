"""
CargoSync — Pydantic schemas for authentication
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


# --- Registration ---
class CompanyRegisterRequest(BaseModel):
    company_name: str
    name: str
    email: str  # Using str instead of EmailStr to avoid extra dep
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None


class TruckerRegisterRequest(CompanyRegisterRequest):
    pass


class AdminRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


# --- Login ---
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# --- Password Reset ---
class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# --- User Profile ---
class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    role: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    user_type: str  # admin, company, or trucker

    model_config = {"from_attributes": True}


# --- Team Invite ---
class TeamInviteRequest(BaseModel):
    email: str
    role: str = "user"


class TeamInviteResponse(BaseModel):
    id: str
    email: str
    role: str
    status: str
    created_at: str
    expires_at: str

    model_config = {"from_attributes": True}
