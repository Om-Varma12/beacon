"""
conftest.py for migration tests.

Provides two key fixtures:

  raw_conn   — a single AsyncConnection to a completely empty public schema.
               Drops and recreates the public schema before and after each test.

  full_schema_conn — same, but also runs Base.metadata.create_all after cleanup,
               so tests can query a fully built schema.

All fixtures are function-scoped to avoid the "Future attached to a different loop"
error that occurs when asyncpg connections are shared across pytest-asyncio event loops.
"""
import os
import pathlib
import pytest_asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy import text

load_dotenv(".env.test")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "\n\n❌  TEST_DATABASE_URL is not set!\n"
        "   Set it in .env.test before running pytest.\n"
    )

# Path to the raw SQL migration files directory
MIGRATIONS_DIR = pathlib.Path(__file__).parent.parent.parent / "db" / "migrations"


async def _reset_schema(conn) -> None:
    """Drop and recreate the public schema — gives a completely empty slate."""
    await conn.execute(text("DROP SCHEMA public CASCADE"))
    await conn.execute(text("CREATE SCHEMA public"))
    await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))


@pytest_asyncio.fixture(scope="function")
async def raw_conn():
    """
    Function-scoped: yields a raw AsyncConnection on a wiped-clean public schema.
    Cleans up again after the test.
    """
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)

    # Pre-clean
    async with engine.begin() as conn:
        await _reset_schema(conn)

    # Yield a plain (non-transactional) connection so DDL works without issues
    async with engine.connect() as conn:
        await conn.execution_options(isolation_level="AUTOCOMMIT")
        yield conn

    # Post-clean
    async with engine.begin() as conn:
        await _reset_schema(conn)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def full_schema_conn():
    """
    Function-scoped: wipes the DB, runs Base.metadata.create_all, then yields a
    connection for inspection tests. Drops all tables after the test.
    """
    import db.database  # noqa — registers all models against Base
    from models.Base import Base

    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)

    async with engine.begin() as conn:
        await _reset_schema(conn)
        await conn.run_sync(Base.metadata.create_all)

    async with engine.connect() as conn:
        await conn.execution_options(isolation_level="AUTOCOMMIT")
        yield conn

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


def read_migration(filename: str) -> str:
    """Read a raw SQL migration file and return its contents."""
    path = MIGRATIONS_DIR / filename
    return path.read_text(encoding="utf-8")
