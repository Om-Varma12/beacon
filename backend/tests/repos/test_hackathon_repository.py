"""
test_hackathon_repository.py
============================
Tests for HackathonRepository against the real test database.

Covers:
  - create()                → upsert with on_conflict_do_nothing on url
  - get_by_id()             → lookup by external_id
  - get_all()               → pagination, sorting, deadline filtering
  - get_total_active_count()→ counts only active (non-expired) hackathons
  - parse_date()            → date parsing utility
"""
import pytest
from datetime import date, timedelta

from db.HackathonRepository import HackathonRepository, parse_date


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _repo(db_session) -> HackathonRepository:
    return HackathonRepository(db_session)


def _future_date(days: int = 30) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def _past_date(days: int = 10) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


async def _create_hackathon(
    db_session,
    external_id: int = None,
    title: str = "Test Hackathon",
    url: str = None,
    deadline: str = None,
) -> int:
    """Helper: insert a hackathon and return its DB id."""
    import random
    repo = _repo(db_session)
    hid = await repo.create({
        "external_id": external_id or random.randint(10000, 99999),
        "title": title,
        "url": url or f"https://example.com/hack/{random.randint(1, 999999)}",
        "submission_deadline": deadline,
    })
    await db_session.flush()
    return hid


# ---------------------------------------------------------------------------
# parse_date() utility
# ---------------------------------------------------------------------------

class TestParseDate:

    def test_valid_iso_date(self):
        result = parse_date("2025-08-01T00:00:00")
        assert result == date(2025, 8, 1)

    def test_valid_date_only(self):
        result = parse_date("2025-12-31")
        assert result == date(2025, 12, 31)

    def test_none_returns_none(self):
        assert parse_date(None) is None

    def test_empty_string_returns_none(self):
        assert parse_date("") is None

    def test_invalid_string_returns_none(self):
        assert parse_date("not-a-date") is None


# ---------------------------------------------------------------------------
# create()
# ---------------------------------------------------------------------------

class TestHackathonRepositoryCreate:

    @pytest.mark.asyncio
    async def test_create_returns_integer_id(self, db_session):
        hid = await _create_hackathon(db_session)
        assert isinstance(hid, int)
        assert hid > 0

    @pytest.mark.asyncio
    async def test_create_duplicate_url_returns_none(self, db_session):
        """on_conflict_do_nothing: second insert with same url should return None."""
        url = "https://unique-url-for-dup-test.com"
        id1 = await _create_hackathon(db_session, url=url)
        id2 = await _repo(db_session).create({"title": "Dup", "url": url})
        # First insert returns an ID, second should return None (conflict ignored)
        assert id1 is not None
        assert id2 is None

    @pytest.mark.asyncio
    async def test_create_with_minimal_data(self, db_session):
        repo = _repo(db_session)
        hid = await repo.create({"title": "Minimal"})
        # url is None so there's no unique conflict — should succeed
        assert hid is not None


# ---------------------------------------------------------------------------
# get_by_id()
# ---------------------------------------------------------------------------

class TestHackathonRepositoryGetById:

    @pytest.mark.asyncio
    async def test_get_by_external_id_returns_correct_hackathon(self, db_session):
        ext_id = 55501
        await _create_hackathon(db_session, external_id=ext_id, title="Find Me")
        result = await _repo(db_session).get_by_id(ext_id)
        assert result is not None
        assert result["external_id"] == ext_id
        assert result["title"] == "Find Me"

    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_missing(self, db_session):
        result = await _repo(db_session).get_by_id(999999999)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id_returns_all_expected_fields(self, db_session):
        ext_id = 55502
        await _create_hackathon(db_session, external_id=ext_id)
        result = await _repo(db_session).get_by_id(ext_id)
        for field in ("id", "external_id", "title", "url", "deadline", "created_at"):
            assert field in result, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# get_all()
# ---------------------------------------------------------------------------

class TestHackathonRepositoryGetAll:

    @pytest.mark.asyncio
    async def test_get_all_returns_list(self, db_session):
        await _create_hackathon(db_session, deadline=_future_date())
        result = await _repo(db_session).get_all()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_all_excludes_past_deadline(self, db_session):
        """Hackathons with a past deadline must NOT appear in get_all results."""
        past_id = await _create_hackathon(db_session, deadline=_past_date())
        result = await _repo(db_session).get_all()
        ids = {h["id"] for h in result}
        assert past_id not in ids

    @pytest.mark.asyncio
    async def test_get_all_includes_future_deadline(self, db_session):
        future_id = await _create_hackathon(db_session, deadline=_future_date())
        result = await _repo(db_session).get_all()
        ids = {h["id"] for h in result}
        assert future_id in ids

    @pytest.mark.asyncio
    async def test_get_all_includes_null_deadline(self, db_session):
        """Hackathons with no deadline (NULL) are treated as always-active."""
        no_deadline_id = await _create_hackathon(db_session, deadline=None)
        result = await _repo(db_session).get_all()
        ids = {h["id"] for h in result}
        assert no_deadline_id in ids

    @pytest.mark.asyncio
    async def test_get_all_respects_limit(self, db_session):
        for i in range(5):
            await _create_hackathon(db_session, deadline=_future_date(), title=f"H{i}")
        await db_session.flush()
        result = await _repo(db_session).get_all(limit=2)
        assert len(result) <= 2

    @pytest.mark.asyncio
    async def test_get_all_cursor_pagination(self, db_session):
        """last_id cursor should skip rows with id <= last_id."""
        ids = []
        for i in range(3):
            hid = await _create_hackathon(db_session, deadline=_future_date())
            ids.append(hid)
        await db_session.flush()

        all_results = await _repo(db_session).get_all(limit=100)
        all_ids = [h["id"] for h in all_results]

        if len(all_ids) >= 2:
            cursor = all_ids[0]
            page2 = await _repo(db_session).get_all(last_id=cursor, limit=100)
            page2_ids = [h["id"] for h in page2]
            assert cursor not in page2_ids


# ---------------------------------------------------------------------------
# get_total_active_count()
# ---------------------------------------------------------------------------

class TestHackathonRepositoryGetTotalActiveCount:

    @pytest.mark.asyncio
    async def test_count_increases_after_insert(self, db_session):
        count_before = await _repo(db_session).get_total_active_count()
        await _create_hackathon(db_session, deadline=_future_date())
        await db_session.flush()
        count_after = await _repo(db_session).get_total_active_count()
        assert count_after == count_before + 1

    @pytest.mark.asyncio
    async def test_count_excludes_expired_hackathons(self, db_session):
        count_before = await _repo(db_session).get_total_active_count()
        await _create_hackathon(db_session, deadline=_past_date())
        await db_session.flush()
        count_after = await _repo(db_session).get_total_active_count()
        # Expired hackathon should not increase the count
        assert count_after == count_before

    @pytest.mark.asyncio
    async def test_count_returns_integer(self, db_session):
        count = await _repo(db_session).get_total_active_count()
        assert isinstance(count, int)
