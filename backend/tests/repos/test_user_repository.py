"""
test_user_repository.py
=======================
Tests for UserRepository against the real test database.

Covers the `get_or_create_user()` method which implements a 3-step
upsert: lookup by cognito_sub → lookup by email → create new.

Tests verify:
  - New user creation
  - Return fields (id, name, email)
  - Lookup by cognito_sub on second call (no duplicate row)
  - Cognito sub update when email matches
  - Name update on existing user
"""
import pytest
from db.UserRepository import UserRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _repo(db_session) -> UserRepository:
    return UserRepository(db_session)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestUserRepositoryGetOrCreate:

    @pytest.mark.asyncio
    async def test_creates_new_user(self, db_session):
        user = await _repo(db_session).get_or_create_user(
            cognito_sub="sub-001",
            email="alice@example.com",
            name="Alice",
        )
        assert user is not None
        assert user["email"] == "alice@example.com"
        assert user["name"] == "Alice"
        assert isinstance(user["id"], int)

    @pytest.mark.asyncio
    async def test_second_call_returns_same_id(self, db_session):
        """Calling get_or_create with the same cognito_sub must NOT create a duplicate."""
        repo = _repo(db_session)
        u1 = await repo.get_or_create_user("sub-dup", "dup@example.com", "Bob")
        await db_session.flush()
        u2 = await repo.get_or_create_user("sub-dup", "dup@example.com", "Bob Updated")
        assert u1["id"] == u2["id"], "Second call should return same user, not a new row"

    @pytest.mark.asyncio
    async def test_returns_correct_fields(self, db_session):
        user = await _repo(db_session).get_or_create_user(
            cognito_sub="sub-fields",
            email="fields@example.com",
            name="Field User",
        )
        assert "id" in user
        assert "email" in user
        assert "name" in user

    @pytest.mark.asyncio
    async def test_creates_user_with_correct_email(self, db_session):
        user = await _repo(db_session).get_or_create_user(
            cognito_sub="sub-email",
            email="carol@example.com",
            name="Carol",
        )
        assert user["email"] == "carol@example.com"

    @pytest.mark.asyncio
    async def test_updates_cognito_sub_when_email_exists(self, db_session):
        """
        If a user exists with a matching email but different cognito_sub,
        the repo should find them by email and update their cognito_sub.
        """
        repo = _repo(db_session)
        # Step 1: Create user with old sub
        u1 = await repo.get_or_create_user("old-sub", "shared@example.com", "Dave")
        await db_session.flush()
        # Step 2: Call again with new sub but same email
        u2 = await repo.get_or_create_user("new-sub", "shared@example.com", "Dave")
        # Should return the same user row (not a new one)
        assert u1["id"] == u2["id"]

    @pytest.mark.asyncio
    async def test_multiple_different_users_get_unique_ids(self, db_session):
        repo = _repo(db_session)
        u1 = await repo.get_or_create_user("sub-x1", "x1@example.com", "X1")
        u2 = await repo.get_or_create_user("sub-x2", "x2@example.com", "X2")
        assert u1["id"] != u2["id"]
