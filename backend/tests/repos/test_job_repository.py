"""
test_job_repository.py
======================
Unit tests for JobRepository against the real test database.

Uses the `db_session` fixture from tests/conftest.py which wraps each test
in a rolled-back transaction, so the DB is always clean after each test.

Tests cover:
  - create()              → returns an integer ID
  - get_by_id()           → returns the correct dict / None for missing
  - update_status()       → transitions status, sets error_message
  - update_result()       → sets result_id
  - increment_retry()     → atomically increments retry_count
  - get_queued_jobs()     → returns only queued jobs, ordered by created_at asc
  - get_jobs_by_status()  → filters by any status
  - get_active_job_for_hackathon()  → finds queued/processing by JSONB payload
  - get_active_assets_job()         → same for 'assets' job_type
"""
import pytest
import pytest_asyncio

from db.JobRepository import JobRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _repo(db_session) -> JobRepository:
    return JobRepository(db_session)


async def _create_job(
    db_session,
    job_type: str = "analysis",
    payload: dict = None,
) -> int:
    """Helper: create a job and return its ID."""
    repo = _repo(db_session)
    jid = await repo.create(job_type=job_type, payload=payload or {})
    await db_session.flush()
    return jid


# ---------------------------------------------------------------------------
# create()
# ---------------------------------------------------------------------------

class TestJobRepositoryCreate:

    @pytest.mark.asyncio
    async def test_create_returns_integer_id(self, db_session):
        repo = _repo(db_session)
        jid = await repo.create(job_type="analysis", payload={"hackathon_id": 1})
        assert isinstance(jid, int)
        assert jid > 0

    @pytest.mark.asyncio
    async def test_create_defaults_status_to_queued(self, db_session):
        jid = await _create_job(db_session, job_type="scrape", payload={})
        job = await _repo(db_session).get_by_id(jid)
        assert job["status"] == "queued"

    @pytest.mark.asyncio
    async def test_create_stores_payload(self, db_session):
        payload = {"hackathon_id": 42, "user_id": 7}
        jid = await _create_job(db_session, payload=payload)
        job = await _repo(db_session).get_by_id(jid)
        assert job["payload"]["hackathon_id"] == 42
        assert job["payload"]["user_id"] == 7

    @pytest.mark.asyncio
    async def test_create_multiple_jobs_have_unique_ids(self, db_session):
        id1 = await _create_job(db_session, payload={"n": 1})
        id2 = await _create_job(db_session, payload={"n": 2})
        assert id1 != id2


# ---------------------------------------------------------------------------
# get_by_id()
# ---------------------------------------------------------------------------

class TestJobRepositoryGetById:

    @pytest.mark.asyncio
    async def test_get_by_id_returns_correct_job(self, db_session):
        jid = await _create_job(db_session, job_type="assets", payload={"x": 1})
        job = await _repo(db_session).get_by_id(jid)
        assert job is not None
        assert job["id"] == jid
        assert job["job_type"] == "assets"

    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_missing(self, db_session):
        job = await _repo(db_session).get_by_id(999999)
        assert job is None

    @pytest.mark.asyncio
    async def test_get_by_id_returns_expected_fields(self, db_session):
        jid = await _create_job(db_session)
        job = await _repo(db_session).get_by_id(jid)
        for field in ("id", "job_type", "payload", "status", "result_id",
                      "retry_count", "error_message", "created_at"):
            assert field in job, f"Missing field in get_by_id result: {field}"


# ---------------------------------------------------------------------------
# update_status()
# ---------------------------------------------------------------------------

class TestJobRepositoryUpdateStatus:

    @pytest.mark.asyncio
    async def test_update_status_to_processing(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_status(jid, "processing")
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["status"] == "processing"

    @pytest.mark.asyncio
    async def test_update_status_to_completed(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_status(jid, "completed")
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["status"] == "completed"

    @pytest.mark.asyncio
    async def test_update_status_to_failed_with_error(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_status(
            jid, "failed", error_message="Something went wrong"
        )
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["status"] == "failed"
        assert job["error_message"] == "Something went wrong"

    @pytest.mark.asyncio
    async def test_update_status_no_error_message_leaves_it_none(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_status(jid, "processing")
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["error_message"] is None

    @pytest.mark.asyncio
    async def test_update_status_nonexistent_job_is_noop(self, db_session):
        """Updating a non-existent job must silently do nothing (no exception)."""
        await _repo(db_session).update_status(999999, "failed")


# ---------------------------------------------------------------------------
# update_result()
# ---------------------------------------------------------------------------

class TestJobRepositoryUpdateResult:

    @pytest.mark.asyncio
    async def test_update_result_sets_result_id(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_result(jid, result_id=55)
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["result_id"] == 55

    @pytest.mark.asyncio
    async def test_update_result_can_set_none(self, db_session):
        jid = await _create_job(db_session)
        await _repo(db_session).update_result(jid, result_id=10)
        await db_session.flush()
        await _repo(db_session).update_result(jid, result_id=None)
        await db_session.flush()
        job = await _repo(db_session).get_by_id(jid)
        assert job["result_id"] is None

    @pytest.mark.asyncio
    async def test_update_result_nonexistent_is_noop(self, db_session):
        await _repo(db_session).update_result(999999, result_id=1)


# ---------------------------------------------------------------------------
# increment_retry()
# ---------------------------------------------------------------------------

class TestJobRepositoryIncrementRetry:

    @pytest.mark.asyncio
    async def test_increment_retry_starts_at_zero(self, db_session):
        jid = await _create_job(db_session)
        job = await _repo(db_session).get_by_id(jid)
        assert job["retry_count"] == 0

    @pytest.mark.asyncio
    async def test_increment_retry_increments_by_one(self, db_session):
        jid = await _create_job(db_session)
        count = await _repo(db_session).increment_retry(jid)
        assert count == 1

    @pytest.mark.asyncio
    async def test_increment_retry_multiple_times(self, db_session):
        jid = await _create_job(db_session)
        repo = _repo(db_session)
        await repo.increment_retry(jid)
        await repo.increment_retry(jid)
        count = await repo.increment_retry(jid)
        assert count == 3

    @pytest.mark.asyncio
    async def test_increment_retry_nonexistent_returns_zero(self, db_session):
        count = await _repo(db_session).increment_retry(999999)
        assert count == 0


# ---------------------------------------------------------------------------
# get_queued_jobs()
# ---------------------------------------------------------------------------

class TestJobRepositoryGetQueuedJobs:

    @pytest.mark.asyncio
    async def test_get_queued_jobs_returns_only_queued(self, db_session):
        repo = _repo(db_session)
        # Create queued and non-queued jobs
        q1 = await _create_job(db_session, payload={"n": 1})
        q2 = await _create_job(db_session, payload={"n": 2})
        fail = await _create_job(db_session, payload={"n": 3})
        await repo.update_status(fail, "failed")
        await db_session.flush()

        jobs = await repo.get_queued_jobs()
        ids = {j["id"] for j in jobs}
        assert q1 in ids
        assert q2 in ids
        assert fail not in ids

    @pytest.mark.asyncio
    async def test_get_queued_jobs_respects_limit(self, db_session):
        repo = _repo(db_session)
        for i in range(5):
            await _create_job(db_session, payload={"i": i})
        await db_session.flush()

        jobs = await repo.get_queued_jobs(limit=3)
        assert len(jobs) <= 3

    @pytest.mark.asyncio
    async def test_get_queued_jobs_empty_when_none_queued(self, db_session):
        jobs = await _repo(db_session).get_queued_jobs()
        # Fresh rolled-back session — should be empty
        assert jobs == []


# ---------------------------------------------------------------------------
# get_jobs_by_status()
# ---------------------------------------------------------------------------

class TestJobRepositoryGetJobsByStatus:

    @pytest.mark.asyncio
    async def test_get_jobs_by_status_processing(self, db_session):
        repo = _repo(db_session)
        jid = await _create_job(db_session)
        await repo.update_status(jid, "processing")
        await db_session.flush()

        jobs = await repo.get_jobs_by_status("processing")
        ids = {j["id"] for j in jobs}
        assert jid in ids

    @pytest.mark.asyncio
    async def test_get_jobs_by_status_does_not_return_other_statuses(self, db_session):
        repo = _repo(db_session)
        q = await _create_job(db_session, payload={"tag": "queued"})
        p = await _create_job(db_session, payload={"tag": "processing"})
        await repo.update_status(p, "processing")
        await db_session.flush()

        jobs = await repo.get_jobs_by_status("processing")
        ids = {j["id"] for j in jobs}
        assert p in ids
        assert q not in ids


# ---------------------------------------------------------------------------
# get_active_job_for_hackathon()
# ---------------------------------------------------------------------------

class TestJobRepositoryGetActiveJobForHackathon:

    @pytest.mark.asyncio
    async def test_finds_queued_analysis_job(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 777
        jid = await repo.create(
            job_type="analysis",
            payload={"hackathon_id": hackathon_id},
        )
        await db_session.flush()

        active = await repo.get_active_job_for_hackathon(hackathon_id)
        assert active is not None
        assert active["id"] == jid
        assert active["status"] == "queued"

    @pytest.mark.asyncio
    async def test_returns_none_for_completed_job(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 888
        jid = await repo.create(
            job_type="analysis",
            payload={"hackathon_id": hackathon_id},
        )
        await repo.update_status(jid, "completed")
        await db_session.flush()

        active = await repo.get_active_job_for_hackathon(hackathon_id)
        assert active is None

    @pytest.mark.asyncio
    async def test_returns_none_when_no_job_exists(self, db_session):
        active = await _repo(db_session).get_active_job_for_hackathon(99999)
        assert active is None

    @pytest.mark.asyncio
    async def test_finds_processing_job(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 111
        jid = await repo.create(
            job_type="analysis",
            payload={"hackathon_id": hackathon_id},
        )
        await repo.update_status(jid, "processing")
        await db_session.flush()

        active = await repo.get_active_job_for_hackathon(hackathon_id)
        assert active is not None
        assert active["status"] == "processing"


# ---------------------------------------------------------------------------
# get_active_assets_job()
# ---------------------------------------------------------------------------

class TestJobRepositoryGetActiveAssetsJob:

    @pytest.mark.asyncio
    async def test_finds_active_assets_job(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 222
        jid = await repo.create(
            job_type="assets",
            payload={"hackathon_id": hackathon_id},
        )
        await db_session.flush()

        active = await repo.get_active_assets_job(hackathon_id)
        assert active is not None
        assert active["id"] == jid

    @pytest.mark.asyncio
    async def test_does_not_return_analysis_jobs(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 333
        await repo.create(
            job_type="analysis",
            payload={"hackathon_id": hackathon_id},
        )
        await db_session.flush()

        active = await repo.get_active_assets_job(hackathon_id)
        assert active is None

    @pytest.mark.asyncio
    async def test_returns_none_for_completed_assets_job(self, db_session):
        repo = _repo(db_session)
        hackathon_id = 444
        jid = await repo.create(
            job_type="assets",
            payload={"hackathon_id": hackathon_id},
        )
        await repo.update_status(jid, "completed")
        await db_session.flush()

        active = await repo.get_active_assets_job(hackathon_id)
        assert active is None
