from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.HackathonEmbedding import HackathonEmbedding
from typing import Optional

class HackathonEmbeddingRepository:

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
