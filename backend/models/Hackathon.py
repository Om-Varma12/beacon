from datetime import date, datetime
from typing import Optional

from sqlalchemy import JSON, func
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .Base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id:                 Mapped[int]                = mapped_column(primary_key=True)
    external_id:        Mapped[Optional[int]]
    title:              Mapped[Optional[str]]
    description:        Mapped[Optional[str]]
    college_name:       Mapped[Optional[str]]
    team_size:          Mapped[Optional[dict]]     = mapped_column(JSON)
    mode:               Mapped[Optional[str]]
    is_paid:            Mapped[Optional[bool]]
    url:                Mapped[Optional[str]]      = mapped_column(unique=True)
    start_date:         Mapped[Optional[date]]
    deadline:           Mapped[Optional[date]]
    created_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())