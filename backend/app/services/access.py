"""
CargoSync — Job and Resource Access Control Service
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.truck import Truck
from app.models.job_request import JobRequest


def can_access_job(job: Job, user: dict, db: Session) -> bool:
    """Check if current user has permission to view/interact with a job."""
    if not job or not user:
        return False

    # Platform administrators have universal access
    if user.get("user_type") == "admin":
        return True

    # Shipper company that created the job
    if user.get("user_type") == "company" and job.company_id == user.get("company_id"):
        return True

    # Trucker / fleet owner whose truck is assigned or accepted, or browsing available jobs
    if user.get("user_type") == "trucker" and user.get("company_id"):
        # Allow truckers to view posted/matched jobs available for acceptance
        if job.status in ("posted", "matched"):
            return True

        # Check if the assigned truck belongs to this trucker company
        if job.truck_id:
            truck = db.query(Truck).filter(
                Truck.id == job.truck_id,
                Truck.company_id == user["company_id"],
            ).first()
            if truck:
                return True

        # Check if there is an accepted job request for this trucker
        req = db.query(JobRequest).filter(
            JobRequest.job_id == job.id,
            JobRequest.trucker_id == user["company_id"],
            JobRequest.status == "accepted",
        ).first()
        if req:
            return True

    return False


def get_job_or_404(job_id: str, user: dict, db: Session) -> Job:
    """Fetch job by ID and verify user access; raise appropriate HTTP exception."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if not can_access_job(job, user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this job")

    return job
