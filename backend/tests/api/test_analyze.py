import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from unittest.mock import AsyncMock

from models.Hackathon import Hackathon
from models.User import User
from models.AgentAnalysis import AgentAnalysis
from models.Job import Job
from models.ChatMessage import ChatMessage
from models.HackathonAsset import HackathonAsset
from models.AgentRound import AgentRound
from models.Resource import Resource
from models.ProblemStatement import ProblemStatement
from utils.redis_manager import get_redis_manager


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(autouse=True)
async def clean_database(db_session: AsyncSession):
    await db_session.execute(delete(ChatMessage))
    await db_session.execute(delete(HackathonAsset))
    await db_session.execute(delete(AgentRound))
    await db_session.execute(delete(AgentAnalysis))
    await db_session.execute(delete(Resource))
    await db_session.execute(delete(ProblemStatement))
    await db_session.execute(delete(Job))
    await db_session.execute(delete(User))
    await db_session.execute(delete(Hackathon))
    await db_session.flush()
    yield


@pytest_asyncio.fixture
async def sample_hackathon(db_session: AsyncSession, clean_database):
    hackathon = Hackathon(
        external_id=99001,
        title="Analyze Test Hackathon",
        description="A hackathon for analysis tests",
        college_name="Test College",
        url="https://example.com/analyze-test",
        team_size={"min": 1, "max": 4},
    )
    db_session.add(hackathon)
    await db_session.flush()
    return hackathon


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession, clean_database):
    user = User(
        cognito_sub="analyze-user-sub",
        email="analyze@example.com",
        name="Analyze User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# POST /hackathons/{id}/analyze
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analyze_creates_job(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
    mocker,
):
    """
    Happy path: POST /analyze creates a PENDING AgentAnalysis, a 'queued' Job,
    pushes the job_id to the real Redis queue, and returns 202.
    """
    # Prevent session.commit() from committing the test transaction
    mocker.patch.object(db_session, "commit", new_callable=AsyncMock)

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
        "name": sample_user.name,
    })

    response = await client.post(f"/hackathons/{sample_hackathon.external_id}/analyze")
    assert response.status_code == 202

    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "queued"

    job_id = data["data"]["job_id"]
    assert isinstance(job_id, int)

    # --- DB assertions ---
    # Job row was created with correct type and status
    result = await db_session.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    assert job is not None
    assert job.status == "queued"
    assert job.job_type == "analysis"
    assert job.payload["hackathon_id"] == sample_hackathon.external_id

    # AgentAnalysis PENDING row was created
    result = await db_session.execute(
        select(AgentAnalysis).where(AgentAnalysis.hackathon_id == sample_hackathon.id)
    )
    analysis = result.scalar_one_or_none()
    assert analysis is not None
    assert analysis.status == "PENDING"

    # --- Redis assertions (real Redis) ---
    redis = get_redis_manager()
    queue_contents = redis.queue_client.lrange("beacon:jobs", 0, -1)
    assert str(job_id) in queue_contents

    # Cleanup: remove our test job_id from the Redis queue
    redis.queue_client.lrem("beacon:jobs", 0, str(job_id))


@pytest.mark.asyncio
async def test_analyze_hackathon_not_found(
    client: AsyncClient,
    sample_user,
    mock_cognito_claims,
):
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.post("/hackathons/99999/analyze")
    assert response.status_code == 404
    assert response.json()["detail"] == "Hackathon not found"


@pytest.mark.asyncio
async def test_analyze_rate_limit_active_job(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
    mocker,
):
    """Returns 429 when an analysis job is already queued/processing for this hackathon."""
    mocker.patch.object(db_session, "commit", new_callable=AsyncMock)

    # Seed an active job in the DB
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

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.post(f"/hackathons/{sample_hackathon.external_id}/analyze")
    assert response.status_code == 429
    assert "already" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# GET /hackathons/{id}/analysis
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_analysis_no_analysis_yet(
    client: AsyncClient,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
):
    """Returns empty dict when no analysis row exists for this hackathon."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/analysis")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == {}


@pytest.mark.asyncio
async def test_get_analysis_pending_includes_job_id(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
):
    """When analysis is PENDING, response includes the active job_id so frontend can reconnect SSE."""
    analysis = AgentAnalysis(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        status="PENDING",
        status_message="Initializing...",
    )
    db_session.add(analysis)
    await db_session.flush()

    job = Job(
        job_type="analysis",
        payload={
            "hackathon_id": sample_hackathon.external_id,
            "user_id": sample_user.id,
            "analysis_id": analysis.id,
        },
        status="queued",
    )
    db_session.add(job)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/analysis")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "PENDING"
    assert data["data"]["status_message"] == "Initializing..."
    assert data["data"]["job_id"] == job.id


@pytest.mark.asyncio
async def test_get_analysis_completed_returns_full_result(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
):
    """When COMPLETED, returns winner, winning_idea, and synthesized fields."""
    analysis = AgentAnalysis(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        status="COMPLETED",
        status_message="Analysis completed successfully.",
        winner="Team Alpha",
        winning_idea={
            "project_title": "Smart Monitor",
            "problem_statement": "Health monitoring gap",
            "solution_overview": "AI wearable",
            "core_features": ["alerts", "tracking"],
            "target_users": ["hospitals"],
            "overall_reasoning": "Best solution",
        },
        synthesized={
            "final_project_title": "Smart Monitor",
        },
    )
    db_session.add(analysis)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/analysis")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "COMPLETED"
    assert data["data"]["result"]["winner"] == "Team Alpha"
    assert data["data"]["result"]["winning_idea"]["project_title"] == "Smart Monitor"
    assert data["data"]["result"]["synthesized"]["final_project_title"] == "Smart Monitor"


@pytest.mark.asyncio
async def test_get_analysis_hackathon_not_found(
    client: AsyncClient,
    sample_user,
    mock_cognito_claims,
):
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get("/hackathons/99999/analysis")
    assert response.status_code == 404
    assert response.json()["detail"] == "Hackathon not found"
