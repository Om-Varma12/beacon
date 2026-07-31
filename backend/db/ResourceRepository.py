from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.Resource import Resource


class ResourceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(self, hackathon_id: int, data: dict):
        resource = Resource(
            hackathon_id=hackathon_id,
            resource_type=data["resource_type"],
            title=data["title"],
            url=data["url"]
        )

        self.session.add(resource)

        await self.session.flush()

        return resource.id
            
    
    async def get_by_hackathon_id(self, hackathon_id: int):
        stmt = (
            select(Resource)
            .where(Resource.hackathon_id == hackathon_id)
            .order_by(Resource.id)
        )

        result = await self.session.execute(stmt)

        resources = result.scalars().all()

        return [
            {
                "id": r.id,
                "resource_type": r.resource_type,
                "title": r.title,
                "url": r.url,
            }
            for r in resources
        ]