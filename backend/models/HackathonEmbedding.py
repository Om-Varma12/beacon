from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from .Base import Base
from pgvector.sqlalchemy import Vector

class HackathonEmbedding(Base):
    __tablename__ = 'hackathon_embeddings'

    hackathon_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    structured_summary: Mapped[Optional[str]] = mapped_column(Text)
    embedding: Mapped[Vector] = mapped_column(Vector(1536))
    embedding_model: Mapped[str] = mapped_column(String(100), server_default='')
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())

    # Foreign key to hackathons table
    __table_args__ = (
        ForeignKeyConstraint('hackathons.id', target_columns=['hackathon_id'], ondelete='CASCADE'),
    )
