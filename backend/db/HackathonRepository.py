from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.Hackathon import Hackathon


def parse_date(value):
    """Convert ISO 8601 string to Python date."""
    if not value:
        return None

    try:
        dt = datetime.fromisoformat(value)
        return dt.date()

    except (ValueError, TypeError):
        return None


class HackathonRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(self, data: dict):
        stmt = (
            insert(Hackathon)
            .values(
                external_id=data.get("external_id"),
                title=data.get("title"),
                description=data.get("description"),
                college_name=data.get("college_name"),
                team_size=data.get("team_size"),
                mode=data.get("mode"),
                is_paid=data.get("is_paid"),
                url=data.get("url"),
                start_date=parse_date(data.get("start_date")),
                deadline=parse_date(data.get("submission_deadline")),
                prizes=data.get("prizes"),
            )
            .on_conflict_do_nothing(index_elements=["url"])
            .returning(Hackathon.id)
        )

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()


    async def get_all(
        self,
        limit: int = 12,
        offset: int = 0,
        sort_by: str = "start_date",
        order: str = "asc",
    ):
        allowed_fields = {
            "start_date": Hackathon.start_date,
            "deadline": Hackathon.deadline,
            "id": Hackathon.id,
        }

        sort_column = allowed_fields.get(
            sort_by,
            Hackathon.start_date,
        )

        if order.lower() == "desc":
            sort_column = sort_column.desc()
        else:
            sort_column = sort_column.asc()

        stmt = (
            select(Hackathon)
            .where(
                or_(
                    Hackathon.deadline.is_(None),
                    Hackathon.deadline >= func.current_date(),
                )
            )
            .order_by(sort_column)
            .limit(limit)
            .offset(offset)
        )

        result = await self.session.execute(stmt)

        hackathons = result.scalars().all()

        return [
            {
                "id": h.id,
                "external_id": h.external_id,
                "title": h.title,
                "description": h.description,
                "college_name": h.college_name,
                "team_size": h.team_size,
                "mode": h.mode,
                "is_paid": h.is_paid,
                "deadline": h.deadline,
            }
            for h in hackathons
        ]


    async def get_total_active_count(self):
        stmt = (
            select(func.count())
            .select_from(Hackathon)
            .where(
                or_(
                    Hackathon.deadline.is_(None),
                    Hackathon.deadline >= func.current_date(),
                )
            )
        )

        result = await self.session.execute(stmt)

        return result.scalar_one()


    async def get_by_id(self, hackathon_id: int):
        stmt = (
            select(Hackathon)
            .where(Hackathon.external_id == hackathon_id)
            .limit(1)
        )

        result = await self.session.execute(stmt)

        hackathon = result.scalar_one_or_none()

        if hackathon is None:
            return None

        return {
            "id": hackathon.id,
            "external_id": hackathon.external_id,
            "title": hackathon.title,
            "description": hackathon.description,
            "college_name": hackathon.college_name,
            "team_size": hackathon.team_size,
            "mode": hackathon.mode,
            "is_paid": hackathon.is_paid,
            "url": hackathon.url,
            "start_date": hackathon.start_date,
            "deadline": hackathon.deadline,
            "prizes": hackathon.prizes,
            "created_at": hackathon.created_at,
        }