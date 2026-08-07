from datetime import datetime
from typing import Optional

from sqlalchemy import func, CheckConstraint, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .Base import Base


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint(
            "job_type IN ('analysis', 'assets', 'scrape')",
            name="chk_jobs_job_type",
        ),
        CheckConstraint(
            "status IN ('queued', 'processing', 'completed', 'failed')",
            name="chk_jobs_status",
        ),
        Index("idx_jobs_status", "status"),
        Index("idx_jobs_job_type", "job_type"),
        Index("idx_jobs_created_at", text("created_at DESC")),
        Index("idx_jobs_result_id", "result_id"),
    )

    id:                 Mapped[int]                = mapped_column(primary_key=True)
    job_type:           Mapped[str]
    payload:            Mapped[dict]               = mapped_column(JSONB)
    status:             Mapped[str]                = mapped_column(server_default="queued")
    result_id:          Mapped[Optional[int]]
    error_message:      Mapped[Optional[str]]
    retry_count:        Mapped[Optional[int]]      = mapped_column(server_default="0")
    created_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    updated_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())