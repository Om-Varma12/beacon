from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .Base import Base


class Job(Base):
    __tablename__ = "jobs"

    id:                 Mapped[int]                = mapped_column(primary_key=True)
    job_type:           Mapped[str]
    payload:            Mapped[dict]               = mapped_column(JSONB)
    status:             Mapped[str]                = mapped_column(server_default="queued")
    result_id:          Mapped[Optional[int]]
    error_message:      Mapped[Optional[str]]
    retry_count:        Mapped[Optional[int]]      = mapped_column(server_default="0")
    created_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    updated_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())