import pytest
import pytest_asyncio
import json
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from unittest.mock import AsyncMock

from models.Hackathon import Hackathon
from models.User import User
from models.Job import Job
from utils.redis_manager import get_redis_manager


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(autouse=True)
async def clean_database(db_session: AsyncSession):
    await db_session.execute(delete(Job))
    await db_session.execute(delete(User))
    await db_session.execute(delete(Hackathon))
    await db_session.flush()
    yield


@pytest_asyncio.fixture
async def sample_hackathon(db_session: AsyncSession, clean_database):
    hackathon = Hackathon(
        external_id=99002,
        title="SSE Test Hackathon",
        description="A hackathon for SSE streaming tests",
        college_name="Test College",
        url="https://example.com/sse-test",
        team_size={"min": 1, "max": 4},
    )
    db_session.add(hackathon)
    await db_session.flush()
    return hackathon


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession, clean_database):
    user = User(
        cognito_sub="sse-user-sub",
        email="sse@example.com",
        name="SSE User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# GET /hackathons/analysis/stream/{job_id}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sse_job_not_found(client: AsyncClient, mocker):
    # Mock token verification to pass
    mocker.patch(
        "api.routes.sse.verify_token",
        AsyncMock(return_value={"sub": "sse-user-sub", "email": "sse@example.com"})
    )

    response = await client.get("/hackathons/analysis/stream/99999?token=valid_token")
    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"


@pytest.mark.asyncio
async def test_sse_invalid_token(client: AsyncClient, mocker):
    from fastapi import HTTPException
    # Mock token verification to raise 401 HTTPException
    mocker.patch(
        "api.routes.sse.verify_token",
        AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid token signature"))
    )

    response = await client.get("/hackathons/analysis/stream/123?token=bad_token")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sse_already_completed_job(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mocker
):
    """If job is completed, it should stream a single final event and close."""
    mocker.patch(
        "api.routes.sse.verify_token",
        AsyncMock(return_value={"sub": sample_user.cognito_sub, "email": sample_user.email})
    )

    job = Job(
        job_type="analysis",
        payload={
            "hackathon_id": sample_hackathon.external_id,
            "user_id": sample_user.id,
        },
        status="completed",
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(
        f"/hackathons/analysis/stream/{job.id}?token=valid_token",
        headers={"Accept": "text/event-stream"}
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    # Read the response events
    lines = [line for line in response.iter_lines() if line]
    assert len(lines) == 1
    assert lines[0].startswith("data: ")
    
    event_data = json.loads(lines[0][6:])
    assert event_data["status"] == "completed"
    assert "Job status: completed" in event_data["message"]


@pytest.mark.asyncio
async def test_sse_streams_replayed_events_and_pubsub(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mocker
):
    """
    Ensures that historical replayed events are read first, and then new progress
    events published to the real Redis channel are received.
    """
    mocker.patch(
        "api.routes.sse.verify_token",
        AsyncMock(return_value={"sub": sample_user.cognito_sub, "email": sample_user.email})
    )

    # 1. Create a processing job in DB
    job = Job(
        job_type="analysis",
        payload={
            "hackathon_id": sample_hackathon.external_id,
            "user_id": sample_user.id,
        },
        status="processing",
    )
    db_session.add(job)
    await db_session.flush()

    redis = get_redis_manager()
    # Clear any leftover events for this job
    await redis.pubsub_client.delete(f"beacon:events:{job.id}")
    await redis.pubsub_client.delete(f"beacon:events:{job.id}:seq")

    # 2. Publish historical event 1 to Redis
    await redis.publish_progress(job.id, "processing", "Historical message 1")

    # 3. Request SSE stream and consume the generator
    # We will background a task to publish new events after 0.5s so we can test live pubsub
    async def publish_live_events():
        await asyncio.sleep(0.5)
        # Publish live event 2
        await redis.publish_progress(job.id, "processing", "Live message 2")
        await asyncio.sleep(0.1)
        # Publish completed event 3 (which will break the SSE read loop)
        await redis.publish_progress(job.id, "completed", "Job finished")

    bg_pub_task = asyncio.create_task(publish_live_events())

    try:
        received_messages = []
        async with client.stream(
            "GET",
            f"/hackathons/analysis/stream/{job.id}?token=valid_token",
            headers={"Accept": "text/event-stream"}
        ) as response:
            assert response.status_code == 200
            async for line in response.aiter_lines():
                if line:
                    if line.startswith("data: "):
                        event_data = json.loads(line[6:])
                        received_messages.append(event_data)
                        # Break loop early if job transitions to completed
                        if event_data.get("status") == "completed":
                            break

        # Verify historical and live events were received in order
        assert len(received_messages) >= 3
        
        # Event 1 (Replayed historical)
        assert received_messages[0]["status"] == "processing"
        assert received_messages[0]["message"] == "Historical message 1"
        assert received_messages[0]["seq"] == 1

        # Event 2 (Live pubsub message)
        assert received_messages[1]["status"] == "processing"
        assert received_messages[1]["message"] == "Live message 2"
        assert received_messages[1]["seq"] == 2

        # Event 3 (Live job completed)
        assert received_messages[2]["status"] == "completed"
        assert received_messages[2]["message"] == "Job finished"
        assert received_messages[2]["seq"] == 3

    finally:
        # Stop background task
        bg_pub_task.cancel()
        # Cleanup redis keys
        await redis.pubsub_client.delete(f"beacon:events:{job.id}")
        await redis.pubsub_client.delete(f"beacon:events:{job.id}:seq")
