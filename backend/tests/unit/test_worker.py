import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from unittest.mock import AsyncMock, MagicMock

from worker import Worker
from models.Hackathon import Hackathon
from models.User import User
from models.Job import Job
from models.AgentAnalysis import AgentAnalysis
from models.HackathonAsset import HackathonAsset
from models.AgentRound import AgentRound
from models.ChatMessage import ChatMessage
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
        external_id=99003,
        title="Worker Test Hackathon",
        description="A hackathon for worker tests",
        college_name="Test College",
        url="https://example.com/worker-test",
        team_size={"min": 1, "max": 4},
    )
    db_session.add(hackathon)
    await db_session.flush()
    return hackathon


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession, clean_database):
    user = User(
        cognito_sub="worker-user-sub",
        email="worker@example.com",
        name="Worker User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_worker_run_analysis_job_success(
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mocker
):
    """
    Test worker.process_job() on an 'analysis' job:
    Verifies that the DebatePipeline is executed, results are saved, and status completes.
    """
    # Mock DebatePipeline
    mock_pipeline_cls = mocker.patch("worker.DebatePipeline")
    mock_run = AsyncMock(return_value={
        "winner": "Agent Beta",
        "leaderboard": [{"agent": "Beta", "score": 9.5}],
        "final_scores": {"Beta": 9.5},
        "winning_idea": {"project_title": "AI Worker Proj"},
        "synthesized": {"final_project_title": "AI Worker Proj"},
        "rounds": [{"round": 1, "ideas": []}]
    })
    mock_pipeline_cls.return_value.run = mock_run

    # Mock HybridLLM (avoid real LLM calls)
    mocker.patch("worker.HybridLLM")

    # Mock Redis manager
    redis = get_redis_manager()
    # Clear any old events
    await redis.pubsub_client.delete("beacon:events:12345")
    await redis.pubsub_client.delete("beacon:events:12345:seq")

    # Create pending analysis row
    analysis = AgentAnalysis(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        status="PENDING"
    )
    db_session.add(analysis)
    await db_session.flush()

    # Seed job in DB
    job = Job(
        id=12345,
        job_type="analysis",
        payload={
            "hackathon_id": sample_hackathon.external_id,
            "user_id": sample_user.id,
            "analysis_id": analysis.id
        },
        status="queued"
    )
    db_session.add(job)
    await db_session.flush()

    # Process job — pass session directly
    worker = Worker()
    await worker.process_job(job.id, session=db_session)

    # Verify DB state updates
    await db_session.refresh(job)
    assert job.status == "completed"
    assert job.result_id == analysis.id

    await db_session.refresh(analysis)
    assert analysis.status == "COMPLETED"
    assert analysis.winner == "Agent Beta"

    # Verify rounds were created
    result = await db_session.execute(
        select(AgentRound).where(AgentRound.analysis_id == analysis.id)
    )
    rounds = result.scalars().all()
    assert len(rounds) == 1
    assert rounds[0].round_number == 1

    # Verify Redis events
    events = await redis.get_replayed_events(job.id)
    assert len(events) > 0
    # The last progress event should contain completed
    assert events[-1]["status"] == "completed"


@pytest.mark.asyncio
async def test_worker_run_assets_job_success(
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mocker
):
    """Test worker.process_job() on an 'assets' job: generates tech plan assets from analysis."""
    # Mocks AssetsAgent
    mocker.patch("services.AssetsService.LLM")
    mock_agent_cls = mocker.patch("services.AssetsService.AssetsAgent")
    mock_agent_cls.return_value.run = AsyncMock(return_value={
        "recommended_tech_stack": {"fe": "Vue"},
        "implementation_phases": [],
        "presentation_slides": []
    })

    # Seed completed analysis row
    analysis = AgentAnalysis(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        status="COMPLETED",
        winning_idea={"project_title": "AI Assets Proj"},
        synthesized={}
    )
    db_session.add(analysis)
    await db_session.flush()

    # Seed job in DB
    job = Job(
        job_type="assets",
        payload={
            "hackathon_id": sample_hackathon.external_id,
            "user_id": sample_user.id,
        },
        status="queued"
    )
    db_session.add(job)
    await db_session.flush()

    # Process job — pass session directly
    worker = Worker()
    await worker.process_job(job.id, session=db_session)

    # Verify DB state
    await db_session.refresh(job)
    assert job.status == "completed"
    assert job.result_id is not None

    # Check generated asset
    result = await db_session.execute(
        select(HackathonAsset).where(HackathonAsset.hackathon_id == sample_hackathon.id)
    )
    asset = result.scalar_one_or_none()
    assert asset is not None
    assert asset.doc_content["title"] == "AI Assets Proj"
    assert asset.doc_content["recommended_tech_stack"] == {"fe": "Vue"}


@pytest.mark.asyncio
async def test_worker_run_scrape_job_success(
    db_session: AsyncSession,
    mocker
):
    """Test worker.process_job() on a 'scrape' job: runs the scraper."""
    mock_scraper = mocker.patch("worker.scraperHackathons", new_callable=AsyncMock)

    job = Job(
        job_type="scrape",
        payload={},
        status="queued"
    )
    db_session.add(job)
    await db_session.flush()

    worker = Worker()
    await worker.process_job(job.id, session=db_session)

    await db_session.refresh(job)
    assert job.status == "completed"
    mock_scraper.assert_called_once()