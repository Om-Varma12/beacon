"""
test_analysis_and_assets_repository.py
=======================================
Tests for AgentAnalysisRepository and AssetsRepository against the real DB.

These repos require a hackathon row to satisfy FK constraints, so each
test creates a hackathon first.

AgentAnalysisRepository covers:
  - create()          → returns analysis ID, defaults to COMPLETED status
  - create_pending()  → creates with PENDING status
  - update_status()   → updates status + status_message
  - update_results()  → stores full result dict, transitions to COMPLETED
  - reset_analysis()  → clears results, sets back to PENDING
  - get_by_hackathon_id() → retrieves latest analysis for hackathon

AssetsRepository covers:
  - create()              → upsert: creates if not exists, updates if exists
  - get_by_hackathon_id() → returns asset dict / None
"""
import pytest
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AssetsRepository import AssetsRepository
from db.HackathonRepository import HackathonRepository
from db.UserRepository import UserRepository


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

async def _seed_hackathon(db_session, url_suffix: str = "") -> int:
    """Create a hackathon and return its PK id."""
    repo = HackathonRepository(db_session)
    hid = await repo.create({
        "title": "Seed Hackathon",
        "url": f"https://seed-hack.example.com/{url_suffix}",
    })
    await db_session.flush()
    return hid


async def _seed_user(db_session, suffix: str = "") -> int:
    """Create a user and return its PK id."""
    repo = UserRepository(db_session)
    user = await repo.get_or_create_user(
        cognito_sub=f"sub-{suffix}",
        email=f"user-{suffix}@example.com",
        name=f"User {suffix}",
    )
    await db_session.flush()
    return user["id"]


def _analysis_repo(db_session) -> AgentAnalysisRepository:
    return AgentAnalysisRepository(db_session)


def _assets_repo(db_session) -> AssetsRepository:
    return AssetsRepository(db_session)


SAMPLE_RESULT = {
    "winner": "Team Alpha",
    "leaderboard": [{"team": "Alpha", "score": 95}],
    "final_scores": {"Alpha": 95, "Beta": 80},
    "winning_idea": {"title": "AI Health", "description": "AI for health"},
    "synthesized": {"summary": "Great ideas presented"},
}


# ===========================================================================
# AgentAnalysisRepository Tests
# ===========================================================================

class TestAgentAnalysisRepositoryCreate:

    @pytest.mark.asyncio
    async def test_create_returns_integer_id(self, db_session):
        hid = await _seed_hackathon(db_session, "create-1")
        aid = await _analysis_repo(db_session).create(hid, SAMPLE_RESULT)
        assert isinstance(aid, int)
        assert aid > 0

    @pytest.mark.asyncio
    async def test_create_stores_result_data(self, db_session):
        hid = await _seed_hackathon(db_session, "create-2")
        repo = _analysis_repo(db_session)
        aid = await repo.create(hid, SAMPLE_RESULT)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["winner"] == "Team Alpha"
        assert record["final_scores"]["Alpha"] == 95

    @pytest.mark.asyncio
    async def test_create_with_user_id(self, db_session):
        hid = await _seed_hackathon(db_session, "create-3")
        uid = await _seed_user(db_session, "analysis-create-uid")
        repo = _analysis_repo(db_session)
        aid = await repo.create(hid, SAMPLE_RESULT, user_id=uid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid, user_id=uid)
        assert record is not None
        assert record["user_id"] == uid


class TestAgentAnalysisRepositoryCreatePending:

    @pytest.mark.asyncio
    async def test_create_pending_sets_pending_status(self, db_session):
        hid = await _seed_hackathon(db_session, "pending-1")
        repo = _analysis_repo(db_session)
        aid = await repo.create_pending(hid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_create_pending_sets_status_message(self, db_session):
        hid = await _seed_hackathon(db_session, "pending-2")
        repo = _analysis_repo(db_session)
        await repo.create_pending(hid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert "Initializing" in record["status_message"]

    @pytest.mark.asyncio
    async def test_create_pending_returns_id(self, db_session):
        hid = await _seed_hackathon(db_session, "pending-3")
        aid = await _analysis_repo(db_session).create_pending(hid)
        assert isinstance(aid, int)


class TestAgentAnalysisRepositoryUpdateStatus:

    @pytest.mark.asyncio
    async def test_update_status_changes_status(self, db_session):
        hid = await _seed_hackathon(db_session, "upd-status-1")
        repo = _analysis_repo(db_session)
        aid = await repo.create_pending(hid)
        await db_session.flush()

        await repo.update_status(aid, "PROCESSING", "Running agents...")
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["status"] == "PROCESSING"
        assert record["status_message"] == "Running agents..."

    @pytest.mark.asyncio
    async def test_update_status_nonexistent_is_noop(self, db_session):
        repo = _analysis_repo(db_session)
        # Should not raise
        await repo.update_status(999999, "FAILED", "Noop")


class TestAgentAnalysisRepositoryUpdateResults:

    @pytest.mark.asyncio
    async def test_update_results_stores_data(self, db_session):
        hid = await _seed_hackathon(db_session, "upd-res-1")
        repo = _analysis_repo(db_session)
        aid = await repo.create_pending(hid)
        await db_session.flush()

        await repo.update_results(aid, SAMPLE_RESULT)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["winner"] == "Team Alpha"
        assert record["status"] == "COMPLETED"

    @pytest.mark.asyncio
    async def test_update_results_uses_custom_status(self, db_session):
        hid = await _seed_hackathon(db_session, "upd-res-2")
        repo = _analysis_repo(db_session)
        aid = await repo.create_pending(hid)
        await db_session.flush()

        await repo.update_results(aid, SAMPLE_RESULT, status="REVIEWING")
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["status"] == "REVIEWING"


class TestAgentAnalysisRepositoryResetAnalysis:

    @pytest.mark.asyncio
    async def test_reset_clears_results(self, db_session):
        hid = await _seed_hackathon(db_session, "reset-1")
        repo = _analysis_repo(db_session)
        aid = await repo.create(hid, SAMPLE_RESULT)
        await db_session.flush()

        await repo.reset_analysis(aid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["winner"] is None
        assert record["leaderboard"] is None

    @pytest.mark.asyncio
    async def test_reset_sets_status_to_pending(self, db_session):
        hid = await _seed_hackathon(db_session, "reset-2")
        repo = _analysis_repo(db_session)
        aid = await repo.create(hid, SAMPLE_RESULT)
        await db_session.flush()

        await repo.reset_analysis(aid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["status"] == "PENDING"


class TestAgentAnalysisRepositoryGetByHackathonId:

    @pytest.mark.asyncio
    async def test_get_returns_latest_analysis(self, db_session):
        """When multiple analyses exist, should return the latest (highest id)."""
        hid = await _seed_hackathon(db_session, "get-latest-1")
        repo = _analysis_repo(db_session)
        aid1 = await repo.create_pending(hid)
        await db_session.flush()
        aid2 = await repo.create_pending(hid)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        assert record["id"] == aid2  # latest

    @pytest.mark.asyncio
    async def test_get_returns_none_for_missing_hackathon(self, db_session):
        record = await _analysis_repo(db_session).get_by_hackathon_id(999999)
        assert record is None

    @pytest.mark.asyncio
    async def test_get_returns_all_expected_fields(self, db_session):
        hid = await _seed_hackathon(db_session, "get-fields-1")
        repo = _analysis_repo(db_session)
        await repo.create(hid, SAMPLE_RESULT)
        await db_session.flush()

        record = await repo.get_by_hackathon_id(hid)
        for field in ("id", "hackathon_id", "user_id", "winner", "leaderboard",
                      "final_scores", "winning_idea", "synthesized", "status",
                      "status_message", "created_at"):
            assert field in record, f"Missing field: {field}"

    @pytest.mark.asyncio
    async def test_get_isolates_by_user_id(self, db_session):
        """Analysis for user A should not be returned when querying for user B."""
        hid = await _seed_hackathon(db_session, "user-isolation-1")
        uid = await _seed_user(db_session, "analysis-isolation-uid")
        repo = _analysis_repo(db_session)
        await repo.create_pending(hid, user_id=uid)
        await db_session.flush()

        # Different user_id should find nothing
        uid2 = await _seed_user(db_session, "analysis-isolation-uid2")
        record = await repo.get_by_hackathon_id(hid, user_id=uid2)
        assert record is None


# ===========================================================================
# AssetsRepository Tests
# ===========================================================================

class TestAssetsRepositoryCreate:

    @pytest.mark.asyncio
    async def test_create_returns_integer_id(self, db_session):
        hid = await _seed_hackathon(db_session, "asset-create-1")
        repo = _assets_repo(db_session)
        asset_id = await repo.create(
            hackathon_id=hid,
            doc_content={"slides": []},
            ppt_content={"pages": []},
        )
        assert isinstance(asset_id, int)
        assert asset_id > 0

    @pytest.mark.asyncio
    async def test_create_twice_updates_existing(self, db_session):
        """Second create() with same hackathon_id must UPDATE not INSERT."""
        hid = await _seed_hackathon(db_session, "asset-upsert-1")
        repo = _assets_repo(db_session)
        id1 = await repo.create(hid, {"v": 1}, {"p": 1})
        await db_session.flush()
        id2 = await repo.create(hid, {"v": 2}, {"p": 2})
        await db_session.flush()

        # Same row updated, same ID returned
        assert id1 == id2
        # Content should be latest
        asset = await repo.get_by_hackathon_id(hid)
        assert asset["doc_content"]["v"] == 2

    @pytest.mark.asyncio
    async def test_create_with_user_id(self, db_session):
        hid = await _seed_hackathon(db_session, "asset-user-1")
        uid = await _seed_user(db_session, "asset-create-uid")
        repo = _assets_repo(db_session)
        asset_id = await repo.create(hid, {"doc": "x"}, {"ppt": "y"}, user_id=uid)
        await db_session.flush()

        asset = await repo.get_by_hackathon_id(hid, user_id=uid)
        assert asset is not None
        assert asset["id"] == asset_id


class TestAssetsRepositoryGetByHackathonId:

    @pytest.mark.asyncio
    async def test_get_returns_asset(self, db_session):
        hid = await _seed_hackathon(db_session, "asset-get-1")
        repo = _assets_repo(db_session)
        await repo.create(hid, {"doc": "data"}, {"ppt": "data"})
        await db_session.flush()

        asset = await repo.get_by_hackathon_id(hid)
        assert asset is not None
        assert asset["hackathon_id"] == hid
        assert asset["doc_content"]["doc"] == "data"

    @pytest.mark.asyncio
    async def test_get_returns_none_when_not_found(self, db_session):
        asset = await _assets_repo(db_session).get_by_hackathon_id(999999)
        assert asset is None

    @pytest.mark.asyncio
    async def test_get_returns_all_expected_fields(self, db_session):
        hid = await _seed_hackathon(db_session, "asset-fields-1")
        repo = _assets_repo(db_session)
        await repo.create(hid, {}, {})
        await db_session.flush()

        asset = await repo.get_by_hackathon_id(hid)
        for field in ("id", "hackathon_id", "doc_content", "ppt_content", "created_at"):
            assert field in asset, f"Missing field: {field}"

    @pytest.mark.asyncio
    async def test_get_isolates_by_user_id(self, db_session):
        """Asset for user A must not be returned when querying for user B."""
        hid = await _seed_hackathon(db_session, "asset-isolation-1")
        uid = await _seed_user(db_session, "asset-isolation-uid")
        repo = _assets_repo(db_session)
        await repo.create(hid, {"u": 1}, {}, user_id=uid)
        await db_session.flush()

        uid2 = await _seed_user(db_session, "asset-isolation-uid2")
        asset = await repo.get_by_hackathon_id(hid, user_id=uid2)
        assert asset is None
