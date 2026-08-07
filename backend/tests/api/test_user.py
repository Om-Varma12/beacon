import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.User import User

@pytest.mark.asyncio
async def test_successful_signup(client: AsyncClient, db_session: AsyncSession, mock_cognito_claims):
    # Mock Cognito claims for a new user
    mock_claims = {
        "token_use": "id",
        "sub": "test-cognito-sub-123",
        "email": "newuser@example.com",
        "name": "New User"
    }
    mock_cognito_claims(mock_claims)

    # Call the /me endpoint
    response = await client.get("/me")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["name"] == "New User"
    assert data["email"] == "newuser@example.com"
    
    # Verify the user was created in the database
    result = await db_session.execute(select(User).where(User.email == "newuser@example.com"))
    user = result.scalar_one_or_none()
    
    assert user is not None
    assert user.cognito_sub == "test-cognito-sub-123"
    assert user.email == "newuser@example.com"
    assert user.name == "New User"

@pytest.mark.asyncio
async def test_successful_login_existing_user(client: AsyncClient, db_session: AsyncSession, mock_cognito_claims):
    # Create a user in the database first
    existing_user = User(
        cognito_sub="existing-sub-456",
        email="existing@example.com",
        name="Existing User"
    )
    db_session.add(existing_user)
    await db_session.flush() # Flush to get it in the session without committing the test transaction

    # Mock Cognito claims for the existing user
    mock_claims = {
        "token_use": "id",
        "sub": "existing-sub-456",
        "email": "existing@example.com",
        "name": "Existing User Updated Name" # Name could differ, but API returns DB name usually or updates it
    }
    mock_cognito_claims(mock_claims)

    # Call the /me endpoint
    response = await client.get("/me")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Assuming get_or_create_user doesn't update existing name in your implementation
    assert data["email"] == "existing@example.com"
    
    # Verify no duplicate was created
    result = await db_session.execute(select(User).where(User.email == "existing@example.com"))
    users = result.scalars().all()
    assert len(users) == 1

@pytest.mark.asyncio
async def test_failure_wrong_token_use(client: AsyncClient, mock_cognito_claims):
    # Mock Cognito claims with wrong token_use
    mock_claims = {
        "token_use": "access", # Must be 'id'
        "sub": "test-sub",
        "email": "test@example.com"
    }
    mock_cognito_claims(mock_claims)

    response = await client.get("/me")
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Only ID tokens are accepted on this endpoint"

@pytest.mark.asyncio
async def test_failure_missing_claims(client: AsyncClient, mock_cognito_claims):
    # Missing email
    mock_claims = {
        "token_use": "id",
        "sub": "test-sub"
    }
    mock_cognito_claims(mock_claims)

    response = await client.get("/me")
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Missing required claims (sub, email) in token"
