from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .Base import Base


class HackathonAsset(Base):
    __tablename__ = "hackathon_assets"

    id:                 Mapped[int]                     = mapped_column(primary_key=True)
    hackathon_id:       Mapped[Optional[int]]           = mapped_column(ForeignKey("hackathons.id"))
    doc_content:        Mapped[Optional[dict]]          = mapped_column(JSONB)
    ppt_content:        Mapped[Optional[dict]]          = mapped_column(JSONB)
    created_at:         Mapped[Optional[datetime]]      = mapped_column(server_default=func.now())
    user_id:            Mapped[Optional[int]]           = mapped_column(ForeignKey("users.id"))