import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock

@pytest.mark.asyncio
async def test_health_check_success(client: AsyncClient, mocker):
    # Mock GroqKeyManager
    mock_key_manager = mocker.patch("api.routes.health.GroqKeyManager")
    mock_key_manager.return_value.get_key.return_value = "fake-key"
    
    # Mock Groq client and completions call
    mock_groq = mocker.patch("api.routes.health.Groq")
    mock_client = MagicMock()
    mock_groq.return_value = mock_client
    
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "healthy"
    assert data["db"]["ok"] is True
    assert data["llm"]["ok"] is True

@pytest.mark.asyncio
async def test_health_check_db_failure(client: AsyncClient, mocker):
    # Mock db session to raise an error
    mocker.patch("api.routes.health.get_session", side_effect=Exception("DB Connection Failed"))
    
    # Mock Groq
    mock_key_manager = mocker.patch("api.routes.health.GroqKeyManager")
    mock_key_manager.return_value.get_key.return_value = "fake-key"
    mock_groq = mocker.patch("api.routes.health.Groq")
    
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["status"] == "unhealthy"
    assert data["db"]["ok"] is False
    assert "DB Connection Failed" in data["db"]["error"]
    assert data["llm"]["ok"] is True

@pytest.mark.asyncio
async def test_health_check_llm_failure(client: AsyncClient, mocker):
    # Mock GroqKeyManager
    mock_key_manager = mocker.patch("api.routes.health.GroqKeyManager")
    mock_key_manager.return_value.get_key.return_value = "fake-key"
    
    # Mock Groq client to raise an exception
    mock_groq = mocker.patch("api.routes.health.Groq")
    mock_groq.return_value.chat.completions.create.side_effect = Exception("LLM Timeout")
    
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["status"] == "unhealthy"
    assert data["db"]["ok"] is True
    assert data["llm"]["ok"] is False
    assert "LLM Timeout" in data["llm"]["error"]
