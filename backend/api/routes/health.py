from fastapi import APIRouter

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_session

from agents.grok_manager import GroqKeyManager
from groq import Groq

router = APIRouter()

@router.get("/health")
async def health_check():
    db_status = {
        "ok": False,
        "error": None,
    }
    llm_status = {
        "ok": False,
        "error": None,
    }

    conn = None
    try:
        async for session in get_session():
            await session.execute(text("SELECT 1"))
            break

        db_status["ok"] = True

    except Exception as exc:
        db_status["error"] = str(exc)


    try:
        key_manager = GroqKeyManager()
        client = Groq(api_key=key_manager.get_key())
        client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": "Reply with ok."},
                {"role": "user", "content": "ping"},
            ],
            max_tokens=1,
        )
        llm_status["ok"] = True
    except Exception as exc:
        llm_status["error"] = str(exc)

    healthy = db_status["ok"] and llm_status["ok"]

    return {
        "success": healthy,
        "status": "healthy" if healthy else "unhealthy",
        "db": db_status,
        "llm": llm_status,
    }