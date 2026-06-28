from fastapi import APIRouter

from db.db_instance import db
from agents.grok_manager import GroqKeyManager
from groq import Groq

router = APIRouter()

@router.get("/health")
def health_check():
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
        conn = db.get_conn()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_status["ok"] = True
    except Exception as exc:
        db_status["error"] = str(exc)
    finally:
        if conn is not None:
            db.release_conn(conn)

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