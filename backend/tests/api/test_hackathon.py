import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import io
from unittest.mock import AsyncMock, MagicMock

from models.Hackathon import Hackathon
from models.User import User
from models.AgentAnalysis import AgentAnalysis
from models.HackathonAsset import HackathonAsset
from models.ChatMessage import ChatMessage
from models.AgentRound import AgentRound
from models.Resource import Resource
from models.ProblemStatement import ProblemStatement
from models.Job import Job
from models.HackathonReaction import HackathonReaction


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(autouse=True)
async def clean_database(db_session: AsyncSession):
    """
    Wipe all hackathon-related rows in FK-safe order BEFORE each test, then yield.
    """
    # Delete in FK-safe order
    await db_session.execute(delete(ChatMessage))
    await db_session.execute(delete(HackathonAsset))
    await db_session.execute(delete(AgentRound))
    await db_session.execute(delete(AgentAnalysis))
    await db_session.execute(delete(Resource))
    await db_session.execute(delete(ProblemStatement))
    await db_session.execute(delete(HackathonReaction))
    await db_session.execute(delete(Job))
    await db_session.execute(delete(User))
    await db_session.execute(delete(Hackathon))
    await db_session.flush()
    yield



@pytest_asyncio.fixture
async def sample_hackathon(db_session: AsyncSession, clean_database):
    """Depends on clean_database so it always runs AFTER cleanup."""
    hackathon = Hackathon(
        external_id=12345,  # Crucial: repository get_by_id filters on external_id
        title="Sample Hackathon",
        description="A test hackathon description",
        college_name="Test College",
        url="https://example.com/test-hackathon",
        team_size={"min": 1, "max": 4},
        prizes={"first": "1000$"}
    )
    db_session.add(hackathon)
    await db_session.flush()
    return hackathon


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession, clean_database):
    """Depends on clean_database so it always runs AFTER cleanup."""
    user = User(
        cognito_sub="test-user-sub",
        email="testuser@example.com",
        name="Test User"
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# GET /hackathons/
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_hackathons_empty(client: AsyncClient):
    response = await client.get("/hackathons/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 0
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_get_hackathons_with_data(client: AsyncClient, sample_hackathon):
    response = await client.get("/hackathons/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["title"] == "Sample Hackathon"


# ---------------------------------------------------------------------------
# GET /hackathons/{id}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_hackathon_detail_success(client: AsyncClient, sample_hackathon):
    response = await client.get(f"/hackathons/{sample_hackathon.external_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "Sample Hackathon"


@pytest.mark.asyncio
async def test_get_hackathon_detail_not_found(client: AsyncClient):
    response = await client.get("/hackathons/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Hackathon not found"


# ---------------------------------------------------------------------------
# POST /hackathons/scrape-hackathons
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_scrape_hackathons(client: AsyncClient, mocker):
    mock_scraper = mocker.patch("api.routes.hackathon.scraperHackathons")

    response = await client.post("/hackathons/scrape-hackathons")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Scraping started in background"
    mock_scraper.assert_called_once()


# ---------------------------------------------------------------------------
# POST /hackathons/{id}/chat
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_chat_with_hackathon_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    mocker,
):
    mocker.patch("services.ChatService.ChatLLM")
    mock_agent_cls = mocker.patch("services.ChatService.HackathonChatAgent")
    mock_agent_cls.return_value.run = AsyncMock(
        return_value={"response": "This is a mock response from agent"}
    )

    response = await client.post(
        f"/hackathons/{sample_hackathon.external_id}/chat",
        json={"message": "Hello Hackathon"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["response"] == "This is a mock response from agent"

    # Verify message was saved to internal DB using internal .id relation
    result = await db_session.execute(
        select(ChatMessage)
        .where(ChatMessage.hackathon_id == sample_hackathon.id)
        .order_by(ChatMessage.id)
    )
    messages = result.scalars().all()
    assert len(messages) == 2
    assert messages[0].role == "user"
    assert messages[0].content == "Hello Hackathon"
    assert messages[1].role == "assistant"
    assert messages[1].content == "This is a mock response from agent"


@pytest.mark.asyncio
async def test_chat_with_hackathon_not_found(client: AsyncClient, mocker):
    mocker.patch("services.ChatService.ChatLLM")
    mocker.patch("services.ChatService.HackathonChatAgent")

    response = await client.post("/hackathons/99999/chat", json={"message": "Hello"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Hackathon not found"


# ---------------------------------------------------------------------------
# GET /hackathons/{id}/assets
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_assets_not_generated(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims
):
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
        "name": sample_user.name,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/assets")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["generated"] is False
    assert data["data"]["doc_content"] is None


@pytest.mark.asyncio
async def test_get_assets_generated(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
):
    asset = HackathonAsset(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        doc_content={"title": "Doc Project"},
        ppt_content={"title": "PPT Project"},
    )
    db_session.add(asset)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
        "name": sample_user.name,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/assets")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["generated"] is True
    assert data["data"]["doc_content"]["title"] == "Doc Project"


# ---------------------------------------------------------------------------
# POST /hackathons/{id}/assets/generate
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generate_assets_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
    mocker,
):
    analysis = AgentAnalysis(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        status="COMPLETED",
        winning_idea={
            "project_title": "AI Project",
            "problem_statement": "Issue",
            "solution_overview": "Sol",
            "core_features": [],
            "target_users": [],
            "overall_reasoning": "Reason",
        },
        synthesized={},
    )
    db_session.add(analysis)
    await db_session.flush()

    mocker.patch("services.AssetsService.LLM")
    mock_agent_cls = mocker.patch("services.AssetsService.AssetsAgent")
    mock_agent_cls.return_value.run = AsyncMock(
        return_value={
            "recommended_tech_stack": {"fe": "React"},
            "implementation_phases": [],
            "presentation_slides": [],
        }
    )

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
        "name": sample_user.name,
    })

    response = await client.post(f"/hackathons/{sample_hackathon.external_id}/assets/generate")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["generated"] is True
    assert data["data"]["doc_content"]["title"] == "AI Project"

    result = await db_session.execute(
        select(HackathonAsset).where(HackathonAsset.hackathon_id == sample_hackathon.id)
    )
    db_asset = result.scalar_one_or_none()
    assert db_asset is not None
    assert db_asset.doc_content["title"] == "AI Project"


@pytest.mark.asyncio
async def test_generate_assets_no_analysis(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, mocker
):
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.post(f"/hackathons/{sample_hackathon.external_id}/assets/generate")
    assert response.status_code == 400
    assert "No analysis found" in response.json()["detail"]


# ---------------------------------------------------------------------------
# GET /hackathons/{id}/assets/download/docx
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_assets_docx_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
    mocker,
):
    mocker.patch(
        "api.routes.hackathon.generate_docx_proposal",
        return_value=io.BytesIO(b"fake docx content"),
    )

    asset = HackathonAsset(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        doc_content={"title": "Super Doc Project"},
        ppt_content={"title": "Super PPT Project"},
    )
    db_session.add(asset)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/assets/download/docx")
    assert response.status_code == 200
    assert "wordprocessingml" in response.headers["content-type"]
    assert "super_doc_project_technical_proposal.docx" in response.headers["content-disposition"]
    assert response.content == b"fake docx content"


# ---------------------------------------------------------------------------
# GET /hackathons/{id}/assets/download/pptx
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_assets_pptx_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_hackathon,
    sample_user,
    mock_cognito_claims,
    mocker,
):
    mocker.patch(
        "api.routes.hackathon.generate_pptx_slides",
        return_value=io.BytesIO(b"fake pptx content"),
    )

    asset = HackathonAsset(
        hackathon_id=sample_hackathon.id,
        user_id=sample_user.id,
        doc_content={"title": "Super Doc Project"},
        ppt_content={"title": "Super PPT Project"},
    )
    db_session.add(asset)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}/assets/download/pptx")
    assert response.status_code == 200
    assert "presentationml" in response.headers["content-type"]
    assert "super_ppt_project_pitch_deck.pptx" in response.headers["content-disposition"]
    assert response.content == b"fake pptx content"


# ---------------------------------------------------------------------------
# PUT /hackathons/{id}/reaction
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_reaction_requires_auth(client: AsyncClient, sample_hackathon):
    """Unauthenticated request should return 403."""
    response = await client.put(
        f"/hackathons/{sample_hackathon.external_id}/reaction",
        json={"reaction": "like"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_reaction_hackathon_not_found(
    client: AsyncClient, sample_user, mock_cognito_claims, mocker
):
    """Should return 404 for non-existent hackathon."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })
    mocker.patch("utils.redis_manager.RedisManager.push_job", return_value=True)

    response = await client.put(
        "/hackathons/999999/reaction",
        json={"reaction": "like"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_reaction_like_queued(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, mocker
):
    """Valid like reaction should push to Redis queue and return 200."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })
    push_mock = mocker.patch("utils.redis_manager.RedisManager.push_job", return_value=True)

    response = await client.put(
        f"/hackathons/{sample_hackathon.external_id}/reaction",
        json={"reaction": "like"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    push_mock.assert_called_once()
    # Verify event structure
    call_args = push_mock.call_args
    import json as json_mod
    event = json_mod.loads(call_args[0][0])
    assert event["reaction"] == "like"
    assert event["userId"] == sample_user.id
    assert event["hackathonId"] == sample_hackathon.id
    assert "eventId" in event
    assert "createdAt" in event


@pytest.mark.asyncio
async def test_reaction_dislike_queued(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, mocker
):
    """Valid dislike reaction should push to Redis queue and return 200."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })
    push_mock = mocker.patch("utils.redis_manager.RedisManager.push_job", return_value=True)

    response = await client.put(
        f"/hackathons/{sample_hackathon.external_id}/reaction",
        json={"reaction": "dislike"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    push_mock.assert_called_once()
    call_args = push_mock.call_args
    import json as json_mod
    event = json_mod.loads(call_args[0][0])
    assert event["reaction"] == "dislike"


@pytest.mark.asyncio
async def test_reaction_remove_queued(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, mocker
):
    """Null reaction (remove) should push None to Redis queue."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })
    push_mock = mocker.patch("utils.redis_manager.RedisManager.push_job", return_value=True)

    response = await client.put(
        f"/hackathons/{sample_hackathon.external_id}/reaction",
        json={"reaction": None},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    call_args = push_mock.call_args
    import json as json_mod
    event = json_mod.loads(call_args[0][0])
    assert event["reaction"] is None


@pytest.mark.asyncio
async def test_reaction_invalid_value(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, mocker
):
    """Invalid reaction value should return 400."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })
    mocker.patch("utils.redis_manager.RedisManager.push_job", return_value=True)

    response = await client.put(
        f"/hackathons/{sample_hackathon.external_id}/reaction",
        json={"reaction": "love"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_hackathon_detail_returns_like_dislike_count(
    client: AsyncClient, sample_hackathon
):
    """GET /hackathons/{id} should include like_count and dislike_count."""
    response = await client.get(f"/hackathons/{sample_hackathon.external_id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "like_count" in data
    assert "dislike_count" in data
    assert data["like_count"] == 0
    assert data["dislike_count"] == 0


@pytest.mark.asyncio
async def test_get_hackathon_detail_my_reaction_when_authenticated(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, db_session
):
    """GET /hackathons/{id} with auth should return myReaction = None when no reaction exists."""
    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "my_reaction" in data
    assert data["my_reaction"] is None


@pytest.mark.asyncio
async def test_get_hackathon_detail_my_reaction_reflects_existing_row(
    client: AsyncClient, sample_hackathon, sample_user, mock_cognito_claims, db_session
):
    """GET /hackathons/{id} with auth should return myReaction = 'like' when a reaction row exists."""
    from datetime import datetime
    reaction = HackathonReaction(
        user_id=sample_user.id,
        hackathon_id=sample_hackathon.id,
        reaction="like",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(reaction)
    await db_session.flush()

    mock_cognito_claims({
        "token_use": "id",
        "sub": sample_user.cognito_sub,
        "email": sample_user.email,
    })

    response = await client.get(f"/hackathons/{sample_hackathon.external_id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["my_reaction"] == "like"

