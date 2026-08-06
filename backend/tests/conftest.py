import os
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from httpx import AsyncClient, ASGITransport

from main import app
from db.database import get_session
from utils.auth import get_current_user_claims

# In a real environment, you'd want to use a separate test DB.
# For this setup, we'll use the existing DATABASE_URL but ensure rollbacks happen.
# Be careful if running tests against a production database.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", os.getenv("DATABASE_URL"))

engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Fixture to provide a transactional database session for each test.
    Rolls back the transaction at the end of the test to ensure isolation.
    """
    async with engine.connect() as connection:
        # Start a transaction for the test
        transaction = await connection.begin()
        
        # Bind the session to the specific connection
        async with TestingSessionLocal(bind=connection) as session:
            yield session
            
            # Rollback the transaction after the test completes
            await transaction.rollback()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """
    Fixture providing an AsyncClient for testing the FastAPI application.
    Overrides the get_session dependency to use the transactional test session.
    """
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
        
    # Clean up overrides after test
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
def mock_cognito_claims():
    """
    Fixture providing a function to override get_current_user_claims.
    This allows setting custom claims per test.
    """
    def _override(claims: dict):
        async def mock_claims():
            return claims
        app.dependency_overrides[get_current_user_claims] = mock_claims
        
    return _override
