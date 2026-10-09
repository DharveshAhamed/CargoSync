"""add company/trucker workflows

Revision ID: 20261001_roles
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "20261001_roles"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    company_columns = {column["name"] for column in inspector.get_columns("companies")}
    job_columns = {column["name"] for column in inspector.get_columns("jobs")}
    if "account_type" not in company_columns:
        op.add_column("companies", sa.Column("account_type", sa.String(30), nullable=False, server_default="company"))
    additions = {
        "description": sa.Column("description", sa.Text(), nullable=True),
        "pickup_location": sa.Column("pickup_location", sa.Text(), nullable=True),
        "delivery_location": sa.Column("delivery_location", sa.Text(), nullable=True),
        "rating": sa.Column("rating", sa.Integer(), nullable=True),
        "feedback": sa.Column("feedback", sa.Text(), nullable=True),
    }
    for name, column in additions.items():
        if name not in job_columns:
            op.add_column("jobs", column)
    if "job_requests" not in inspector.get_table_names():
        op.create_table(
            "job_requests",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=False),
            sa.Column("truck_id", sa.String(36), sa.ForeignKey("trucks.id"), nullable=False),
            sa.Column("trucker_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("job_requests")}
    if "idx_job_requests_trucker_status" not in indexes:
        op.create_index("idx_job_requests_trucker_status", "job_requests", ["trucker_id", "status"])
    if "idx_job_requests_job" not in indexes:
        op.create_index("idx_job_requests_job", "job_requests", ["job_id"])


def downgrade():
    op.drop_index("idx_job_requests_job", table_name="job_requests")
    op.drop_index("idx_job_requests_trucker_status", table_name="job_requests")
    op.drop_table("job_requests")
    for column in ("feedback", "rating", "delivery_location", "pickup_location", "description"):
        op.drop_column("jobs", column)
    op.drop_column("companies", "account_type")
