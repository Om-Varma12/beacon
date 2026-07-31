from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.AgentRound import AgentRound


class AgentRoundsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(
        self,
        analysis_id: int,
        round_number: int,
        data: dict,
        user_id: int = None,
    ):
        round_obj = AgentRound(
            analysis_id=analysis_id,
            user_id=user_id,
            round_number=round_number,
            phase=data.get("phase"),
            ideas=data.get("ideas", []),
            debates=data.get("debates", []),
            judge=data.get("judge", {}),
        )

        self.session.add(round_obj)

        await self.session.flush()

        return round_obj.id


    async def get_by_analysis_id(self, analysis_id: int):
        stmt = (
            select(AgentRound)
            .where(AgentRound.analysis_id == analysis_id)
            .order_by(AgentRound.round_number.asc())
        )

        result = await self.session.execute(stmt)

        rounds = result.scalars().all()

        return [
            {
                "id": r.id,
                "analysis_id": r.analysis_id,
                "user_id": r.user_id,
                "round_number": r.round_number,
                "phase": r.phase,
                "ideas": r.ideas,
                "debates": r.debates,
                "judge": r.judge,
                "created_at": r.created_at,
            }
            for r in rounds
        ]