"""
conftest.py for migration tests.

Provides fixtures for testing both raw SQL migrations and Alembic migrations:

  raw_conn   — a single AsyncConnection to a completely empty public schema.
               Drops and recreates the public schema before and after each test.

  full_schema_conn — same, but also runs Base.metadata.create_all after cleanup,
               so tests can query a fully built schema.

  alembic_conn — wipes the DB, runs Alembic migrations up, then yields a connection.
               Drops all tables via Alembic downgrade after the test.

All fixtures are function-scoped to avoid the "Future attached to a different loop"
error that occurs when asyncpg connections are shared across pytest-asyncio event loops.
"""
import os
import pathlib
import pytest_asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from alembic.config import Config
from alembic import command

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


# ---------------------------------------------------------------------------
# Alembic migration fixtures
# ---------------------------------------------------------------------------

def _get_alembic_config() -> Config:
    """Create and configure an Alembic Config object for testing."""
    backend_dir = pathlib.Path(__file__).parent.parent.parent
    alembic_dir = backend_dir / "alembic"
    ini_path = backend_dir / "alembic.ini"
    
    config = Config(str(ini_path))
    config.set_main_option("script_location", str(alembic_dir))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    
    return config


@pytest_asyncio.fixture(scope="function")
async def alembic_conn():
    """
    Function-scoped: wipes the DB, runs Alembic migrations up to head,
    then yields a connection for testing. Runs Alembic downgrade to base
    after the test to clean up.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.pool import NullPool
    
    # Create a sync engine for Alembic (Alembic is synchronous)
    sync_db_url = TEST_DATABASE_URL.replace("+asyncpg", "")
    sync_engine = create_engine(sync_db_url, poolclass=NullPool)
    
    # Pre-clean: drop schema to ensure clean state
    with sync_engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
    
    # Run Alembic upgrade to head
    config = _get_alembic_config()
    with sync_engine.begin() as conn:
        config.attributes["connection"] = conn
        command.upgrade(config, "head")
    
    # Create async engine for testing
    async_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    
    # Yield a connection for testing
    async with async_engine.connect() as conn:
        await conn.execution_options(isolation_level="AUTOCOMMIT")
        yield conn
    
    # Post-clean: run Alembic downgrade to base
    with sync_engine.begin() as conn:
        config.attributes["connection"] = conn
        command.downgrade(config, "base")
    
    # Final cleanup: drop schema
    with sync_engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
    
    sync_engine.dispose()
    await async_engine.dispose()
