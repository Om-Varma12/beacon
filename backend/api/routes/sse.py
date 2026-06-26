from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import asyncio

from db.database import Database
from db.HackathonRepository import HackathonRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from utils.sse_queue import get_sse_queue
from utils.auth import get_current_user_claims

router = APIRouter()
db = Database()


def get_hackathon_repo():
    return HackathonRepository(db)


def get_analysis_repo():
    return AgentAnalysisRepository(db)


@router.get("/analysis/stream")
async def stream_analysis_status(
    hackathon_id: int = Query(...),
    token: str = Query(...),
    claims: dict = Depends(get_current_user_claims),
    hackathon_repo: HackathonRepository = Depends(get_hackathon_repo),
    analysis_repo: AgentAnalysisRepository = Depends(get_analysis_repo)
):
    """
    SSE endpoint for real-time analysis status updates.
    
    Token is passed via query parameter because EventSource doesn't support custom headers.
    """
    # Resolve user ID from claims
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    
    if not cognito_sub or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    # Get hackathon
    hackathon = hackathon_repo.get_by_id(hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    internal_hackathon_id = hackathon["id"]
    
    # Get existing analysis
    analysis = analysis_repo.get_by_hackathon_id(internal_hackathon_id, user_id=None)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis_id = analysis["id"]
    current_status = analysis.get("status", "PENDING")
    current_message = analysis.get("status_message", "Initializing...")
    
    # If already completed/failed, send final event and close
    if current_status in ("COMPLETED", "FAILED"):
        async def send_final():
            yield f"data: {json.dumps({'status': current_status, 'status_message': current_message})}\n\n"
        
        return StreamingResponse(
            send_final(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    # Stream events from SSE queue
    sse_queue = get_sse_queue()
    
    async def event_generator():
        try:
            # Send current status immediately
            yield f"data: {json.dumps({'status': current_status, 'status_message': current_message})}\n\n"
            
            # Stream new events
            async for event in sse_queue.get_events(analysis_id):
                event_data = {
                    'status': event.status,
                    'status_message': event.status_message,
                    'timestamp': event.timestamp
                }
                yield f"data: {json.dumps(event_data)}\n\n"
                
                # Send keepalive every 15 seconds to prevent timeout
                try:
                    await asyncio.wait_for(
                        asyncio.sleep(15),
                        timeout=15.0
                    )
                    yield ": keepalive\n\n"
                except asyncio.TimeoutError:
                    pass
                    
        except asyncio.CancelledError:
            # Client disconnected
            print(f"SSE client disconnected for analysis_id: {analysis_id}")
            raise
        except Exception as e:
            print(f"SSE error for analysis_id: {analysis_id}: {e}")
            error_data = {
                'status': 'ERROR',
                'status_message': f'Stream error: {str(e)}'
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )
