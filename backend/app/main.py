"""
CargoSync Backend — Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.deps import Base, engine

# Import all models so they register with Base.metadata
from app.models.company import Company
from app.models.user import User
from app.models.admin import Admin
from app.models.truck import Truck
from app.models.driver import Driver
from app.models.job import Job
from app.models.box import Box
from app.models.delivery import Delivery
from app.models.claim import Claim
from app.models.audit_log import AuditLog
from app.models.team_invite import TeamInvite
from app.models.job_request import JobRequest

# Import routers
from app.api.v1.auth import router as auth_router
from app.api.v1.trucks import router as trucks_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.boxes import router as boxes_router
from app.api.v1.deliveries import router as deliveries_router
from app.api.v1.qr import router as qr_router
from app.api.v1.scanning import router as scanning_router
from app.api.v1.packing import router as packing_router
from app.api.v1.audit import router as audit_router
from app.api.v1.admin import router as admin_router

settings = get_settings()

# Create the FastAPI app with lifespan
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (gracefully handles missing DB)."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created/verified")
    except Exception as e:
        print(f"⚠ Could not connect to database: {e}")
        print("  The API will start but database operations will fail.")
        print("  Please configure DATABASE_URL in backend/.env")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Freight & Fleet Orchestration Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(trucks_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(boxes_router, prefix="/api/v1")
app.include_router(deliveries_router, prefix="/api/v1")
app.include_router(qr_router, prefix="/api/v1")
app.include_router(scanning_router, prefix="/api/v1")
app.include_router(packing_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint — API health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
