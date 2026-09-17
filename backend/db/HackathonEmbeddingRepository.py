from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Text, String, DateTime, ForeignKey, Float, func
from datetime import datetime
from typing import Optional

class HackathonEmbedding(Base):
    __tablename__ = 'hackathon_embeddings'

    hackathon_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    structured_summary: Mapped[Optional[str]] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(nullable=False) # Using list for vector
    embedding_model: Mapped[str] = mapped_column(String(100), server_default='')
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())

class HackathonEmbeddingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_hackathon_id(self, hackathon_id: int) -> Optional[dict]:
        result = await self.session.execute(
            select(HackathonEmbedding).where(HackathonEmbedding.hackathon_id == hackathon_id)
        )
        embedding_obj = result.scalar_one_or_none()
        if not embedding_obj:
            return None

        return {
            "hackathon_id": embedding_obj.hackathon_id,
            "embedding": embedding_obj.embedding,
            "structured_summary": embedding_obj.structured_summary
        }
