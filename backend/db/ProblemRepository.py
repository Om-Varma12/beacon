from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.ProblemStatement import ProblemStatement


class ProblemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(self, hackathon_id: int, data: dict):
        problem = ProblemStatement(
            hackathon_id=hackathon_id,
            title=data.get("title"),
            description=data.get("description"),
            type=data.get("type"),
        )

        self.session.add(problem)

        await self.session.flush()

        return problem.id


    async def get_by_hackathon_id(self, hackathon_id: int):
        stmt = (
            select(ProblemStatement)
            .where(ProblemStatement.hackathon_id == hackathon_id)
            .order_by(ProblemStatement.id.asc())
        )

        result = await self.session.execute(stmt)

        problems = result.scalars().all()

        return [
            {
                "id": p.id,
                "hackathon_id": p.hackathon_id,
                "title": p.title,
                "description": p.description,
                "type": p.type,
            }
            for p in problems
        ]