import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker
)

# Check if we are running in test mode and use the test database url if set
db_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")

from sqlalchemy.pool import NullPool

if os.getenv("TEST_DATABASE_URL"):
    # Disable pooling for tests to avoid asyncpg ProactorEventLoop closed errors
    engine = create_async_engine(
        db_url,
        poolclass=NullPool,
        connect_args={
            "command_timeout": 30,
        }
    )
else:
    engine = create_async_engine(
        db_url,
        pool_size=20,
        max_overflow=30,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        connect_args={
            "command_timeout": 30,
        }
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
from models.HackathonReaction import HackathonReaction
from models.ProblemStatement import ProblemStatement
from models.Resource import Resource
from models.AgentAnalysis import AgentAnalysis
from models.AgentRound import AgentRound
from models.ChatMessage import ChatMessage
from models.HackathonAsset import HackathonAsset
from models.Job import Job