"""
CargoSync — Alembic migration environment

Reads DATABASE_URL from .env and configures SQLAlchemy target metadata
from all CargoSync models for autogenerate support.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Import our application's Base and all models so metadata is populated
from app.core.deps import Base, engine
from app.core.config import get_settings

# Import all models to register them with Base.metadata
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

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata

# Override sqlalchemy.url from our .env settings
settings = get_settings()
if settings.DATABASE_URL:
    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
    config.set_main_option("sqlalchemy.url", db_url.replace("%", "%%"))
else:
    config.set_main_option("sqlalchemy.url", str(engine.url))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. By skipping the Engine
    creation we don't even need a DBAPI to be available.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate
    a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
