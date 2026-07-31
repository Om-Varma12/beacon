from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.ChatMessage import ChatMessage


class ChatMessageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(
        self,
        hackathon_id: int,
        role: str,
        content: str,
    ):
        message = ChatMessage(
            hackathon_id=hackathon_id,
            role=role,
            content=content,
        )

        self.session.add(message)

        await self.session.flush()

        return message.id


    async def get_recent_by_hackathon_id(
        self,
        hackathon_id: int,
        limit: int = 10,
    ):
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.hackathon_id == hackathon_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)

        messages = result.scalars().all()

        # Reverse so conversation flows correctly
        messages.reverse()

        return [
            {
                "id": m.id,
                "hackathon_id": m.hackathon_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
            }
            for m in messages
        ]