import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker
)

engine = create_async_engine(
    os.getenv("DATABASE_URL"),
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

async def get_session():
    """Dependency injection for async database sessions."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Import all models to ensure they are registered with Base.metadata
from models.User import User
from models.Hackathon import Hackathon
from models.ProblemStatement import ProblemStatement
from models.Resource import Resource
from models.AgentAnalysis import AgentAnalysis
from models.AgentRound import AgentRound
from models.ChatMessage import ChatMessage
from models.HackathonAsset import HackathonAsset
from models.Job import Job