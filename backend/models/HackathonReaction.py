from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .Base import Base


class HackathonReaction(Base):
    __tablename__ = "hackathon_reactions"

    user_id:        Mapped[int]       = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    hackathon_id:   Mapped[int]       = mapped_column(ForeignKey("hackathons.id", ondelete="CASCADE"), primary_key=True)
    reaction:       Mapped[str]       = mapped_column(String(10))
    created_at:     Mapped[datetime]  = mapped_column(server_default=func.now())
    updated_at:     Mapped[datetime]  = mapped_column(server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("reaction IN ('like', 'dislike')", name="chk_hackathon_reactions_reaction"),
    )
