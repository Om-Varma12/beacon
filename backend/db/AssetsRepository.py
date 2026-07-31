from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.HackathonAsset import HackathonAsset


class AssetsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(
        self,
        hackathon_id: int,
        doc_content: dict,
        ppt_content: dict,
        user_id: int = None,
    ):
        stmt = (
            select(HackathonAsset)
            .where(HackathonAsset.hackathon_id == hackathon_id)
        )

        if user_id is not None:
            stmt = stmt.where(HackathonAsset.user_id == user_id)
        else:
            stmt = stmt.where(HackathonAsset.user_id.is_(None))

        result = await self.session.execute(stmt)

        asset = result.scalar_one_or_none()

        if asset is None:
            asset = HackathonAsset(
                hackathon_id=hackathon_id,
                user_id=user_id,
                doc_content=doc_content,
                ppt_content=ppt_content,
            )

            self.session.add(asset)

            await self.session.flush()

            return asset.id

        asset.doc_content = doc_content
        asset.ppt_content = ppt_content

        # Optional only if your model doesn't automatically update this field
        # asset.created_at = datetime.utcnow()

        return asset.id


    async def get_by_hackathon_id(
        self,
        hackathon_id: int,
        user_id: int = None,
    ):
        stmt = (
            select(HackathonAsset)
            .where(HackathonAsset.hackathon_id == hackathon_id)
            .limit(1)
        )

        if user_id is not None:
            stmt = stmt.where(HackathonAsset.user_id == user_id)
        else:
            stmt = stmt.where(HackathonAsset.user_id.is_(None))

        result = await self.session.execute(stmt)

        asset = result.scalar_one_or_none()

        if asset is None:
            return None

        return {
            "id": asset.id,
            "hackathon_id": asset.hackathon_id,
            "doc_content": asset.doc_content,
            "ppt_content": asset.ppt_content,
            "created_at": asset.created_at,
        }