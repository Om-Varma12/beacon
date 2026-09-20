from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession
from models.UserPreferenceCluster import UserPreferenceCluster
from typing import Optional, List

class UserPreferenceClusterRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: int) -> List[dict]:
        result = await self.session.execute(
            select(UserPreferenceCluster).where(UserPreferenceCluster.user_id == user_id)
        )
        clusters = result.scalars().all()
        return [
            {
                "id": c.id,
                "user_id": c.user_id,
                "embedding": c.embedding,
                "weight_sum": c.weight_sum
            }
            for c in clusters
        ]

    async def create(self, user_id: int, embedding: list[float], weight_sum: float) -> int:
        new_cluster = UserPreferenceCluster(
            user_id=user_id,
            embedding=embedding,
            weight_sum=weight_sum
        )
        self.session.add(new_cluster)
        await self.session.flush()
        return new_cluster.id

    async def update(self, cluster_id: int, embedding: list[float], weight_sum: float):
        await self.session.execute(
            update(UserPreferenceCluster)
            .where(UserPreferenceCluster.id == cluster_id)
            .values(
                embedding=embedding,
                weight_sum=weight_sum,
                updated_at=func.now()
            )
        )
