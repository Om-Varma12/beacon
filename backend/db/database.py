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