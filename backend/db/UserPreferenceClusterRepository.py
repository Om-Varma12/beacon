from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.Base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Float, DateTime, ForeignKey, func
from datetime import datetime
from typing import Optional, List

class UserPreferenceCluster(Base):
    __tablename__ = 'user_preference_clusters'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(nullable=False)
    weight_sum: Mapped[float] = mapped_column(Float, nullable=False, server_default='0')
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())

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
