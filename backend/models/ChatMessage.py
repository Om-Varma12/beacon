from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from Base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id:                 Mapped[int]                = mapped_column(primary_key=True)
    hackathon_id:       Mapped[int]                = mapped_column(ForeignKey("hackathons.id"))
    role:               Mapped[str]
    content:            Mapped[str]
    created_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())