from datetime import datetime

from typing import Optional

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import func, ForeignKey

from Base import Base

class AgentAnalysis(Base):
    __tablename__ = "agent_analysis"
    
    id:                 Mapped[int]                     = mapped_column(primary_key=True)
    hackathon_id:       Mapped[int]                     = mapped_column(ForeignKey("hackathons.id"))
    winner:             Mapped[Optional[str]]
    leaderboard:        Mapped[Optional[dict]]          = mapped_column(JSONB)
    final_scores:       Mapped[Optional[dict]]          = mapped_column(JSONB)
    winning_idea:       Mapped[Optional[dict]]          = mapped_column(JSONB)
    synthesized:        Mapped[Optional[dict]]          = mapped_column(JSONB)
    created_at:         Mapped[Optional[datetime]]      = mapped_column(server_default=func.now())
    user_id:            Mapped[Optional[int]]           = mapped_column(ForeignKey("users.id"))
    status:             Mapped[str]                     = mapped_column(server_default="COMPLETED")
    status_message:     Mapped[Optional[str]]           = mapped_column(server_default="")