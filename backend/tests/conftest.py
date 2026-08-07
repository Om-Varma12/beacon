import os
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncConnection,
)
from sqlalchemy.pool import NullPool
from httpx import AsyncClient, ASGITransport

# Load test env file
load_dotenv(".env.test")

# ---------------------------------------------------------------------------
# Safety guard: never run against production DB
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "\n\n❌  TEST_DATABASE_URL is not set!\n"
        "   Set it in your shell or .env.test before running pytest.\n"
        "   Example: TEST_DATABASE_URL=postgresql+asyncpg://postgres:testpassword@localhost:5433/beacon_test\n"
        "   Start the test DB with:  docker compose -f docker-compose.test.yml up -d\n"
    )

# ---------------------------------------------------------------------------
# Import app + overrideable dependencies
# ---------------------------------------------------------------------------
from main import app
from db.database import get_session
from utils.auth import get_current_user_claims

# Import all models so Base.metadata is fully populated
import db.database  # noqa: F401 – registers all models against Base

from models.Base import Base

# ---------------------------------------------------------------------------
# Session-scoped engine  (one engine for the whole pytest run)
# ---------------------------------------------------------------------------
_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)


# ---------------------------------------------------------------------------
# Create the full schema once before all tests, drop it after all tests
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def event_loop_policy():
    """
    Keep the default event-loop policy.
    pytest-asyncio handles per-test loops; this is just a placeholder hook
    so the session fixtures below run cleanly.
    """
    pass


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_schema():
    """
    Create all tables at the start of the session, drop them at the end.
    This gives us a clean, schema-correct test database without Alembic.
    """
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield  # all tests run here

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await _engine.dispose()


# ---------------------------------------------------------------------------
# Per-test transactional session — rolls back after every test
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="function")
async def db_session(create_test_schema) -> AsyncSession:
    """
    Wraps each test in a savepoint transaction that is rolled back
    after the test completes, keeping the DB clean between tests.
    """
    async with _engine.connect() as connection:
        transaction = await connection.begin()

        session_factory = async_sessionmaker(
            bind=connection,
            expire_on_commit=False,
            class_=AsyncSession,
        )
        async with session_factory() as session:
            yield session

        await transaction.rollback()


# ---------------------------------------------------------------------------
# Async HTTP client — wired to the test session
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncClient:
    """
    AsyncClient whose get_session dependency is overridden to use the
    per-test transactional session.
    """
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Cognito mock helper
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_cognito_claims():
    """
    Returns a callable that installs a fake get_current_user_claims
    dependency for the duration of the current test.
    """
    def _override(claims: dict):
        async def _fake_claims():
            return claims
        app.dependency_overrides[get_current_user_claims] = _fake_claims

    return _override


@pytest_asyncio.fixture(autouse=True)
async def reset_redis_singleton():
    """
    Resets the RedisManager singleton before each test and closes connections
    after each test. This ensures all Redis clients are bound to the active
    test event loop and prevents "Event loop is closed" errors.
    """
    from utils.redis_manager import RedisManager, get_redis_manager
    
    # Save old instance
    old_instance = RedisManager._instance
    # Reset singleton
    RedisManager._instance = None
    
    # Initialize a clean manager for the current test loop
    manager = get_redis_manager()
    
    yield
    
    # Close connections on the current loop
    await manager.close()
    
    if old_instance:
        try:
            old_instance.queue_client.close()
            await old_instance.pubsub_client.close()
        except Exception:
            pass

