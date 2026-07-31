from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from ..models.User import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def get_or_create_user(
        self,
        cognito_sub: str,
        email: str,
        name: str,
    ):
        # 1. Try to fetch by cognito_sub
        stmt = (
            select(User)
            .where(User.cognito_sub == cognito_sub)
        )

        result = await self.session.execute(stmt)

        user = result.scalar_one_or_none()

        if user is not None:
            user.name = name
            user.last_login_at = func.now()
            user.updated_at = func.now()

            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            }

        # 2. Try to fetch by email
        stmt = (
            select(User)
            .where(User.email == email)
        )

        result = await self.session.execute(stmt)

        user = result.scalar_one_or_none()

        if user is not None:
            user.cognito_sub = cognito_sub
            user.name = name
            user.last_login_at = func.now()
            user.updated_at = func.now()

            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            }

        # 3. Create a new user
        user = User(
            cognito_sub=cognito_sub,
            email=email,
            name=name,
            last_login_at=func.now(),
        )

        self.session.add(user)

        await self.session.flush()

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }