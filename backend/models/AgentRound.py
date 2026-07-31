from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .Base import Base


class AgentRound(Base):
    __tablename__ = "agent_rounds"

    id:                 Mapped[int]                     = mapped_column(primary_key=True)
    analysis_id:        Mapped[int]                     = mapped_column(ForeignKey("agent_analysis.id"))
    round_number:       Mapped[int]
    phase:              Mapped[Optional[str]]
    ideas:              Mapped[Optional[dict]]          = mapped_column(JSONB)
    debates:            Mapped[Optional[dict]]          = mapped_column(JSONB)
    judge:              Mapped[Optional[dict]]          = mapped_column(JSONB)
    created_at:         Mapped[Optional[datetime]]      = mapped_column(server_default=func.now())
    user_id:            Mapped[Optional[int]]           = mapped_column(ForeignKey("users.id"))