from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import asyncio

from db.db_instance import db
from db.HackathonRepository import HackathonRepository
from db.JobRepository import JobRepository
from utils.redis_manager import get_redis_manager
from utils.auth import get_current_user_claims

router = APIRouter()

def get_hackathon_repo():
    return HackathonRepository(db)


def get_job_repo():
    return JobRepository(db)


@router.get("/analysis/stream/{job_id}")
async def stream_analysis_status(
    job_id: int,
    token: str = Query(...),
    claims: dict = Depends(get_current_user_claims),
    job_repo: JobRepository = Depends(get_job_repo)
):
    """
    SSE endpoint for real-time job progress updates via Redis Pub/Sub.
    
    Token is passed via query parameter because EventSource doesn't support custom headers.
    """
    # Resolve user ID from claims
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    
    if not cognito_sub or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    # Get job
    job = job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    current_status = job.get("status", "queued")
    current_message = f"Job status: {current_status}"
    
    # If already completed/failed, send final event and close
    if current_status in ("completed", "failed"):
        async def send_final():
            yield f"data: {json.dumps({'status': current_status, 'message': current_message})}\n\n"
        
        return StreamingResponse(
            send_final(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    # Stream events from Redis Pub/Sub
    redis = get_redis_manager()
    
    async def event_generator():
        pubsub = None
        try:
            # Subscribe to Redis Pub/Sub
            pubsub = redis.subscribe(job_id)
            
            # Send current status immediately
            yield f"data: {json.dumps({'status': current_status, 'message': current_message})}\n\n"
            
            # Stream new events from Redis
            while True:
                message = pubsub.get_message(timeout=15)
                if message:
                    if message["type"] == "message":
                        try:
                            event_data = json.loads(message["data"])
                            # Only send events for this job
                            if event_data.get("job_id") == job_id:
                                yield f"data: {json.dumps({'status': event_data.get('status'), 'message': event_data.get('message')})}\n\n"
                                
                                # Stop if job is completed or failed
                                if event_data.get("status") in ("completed", "failed"):
                                    break
                        except json.JSONDecodeError:
                            pass
                else:
                    # Send keepalive every 15 seconds
                    yield ": keepalive\n\n"
                    
        except asyncio.CancelledError:
            # Client disconnected
            print(f"SSE client disconnected for job_id: {job_id}")
            raise
        except Exception as e:
            print(f"SSE error for job_id: {job_id}: {e}")
            error_data = {
                'status': 'ERROR',
                'message': f'Stream error: {str(e)}'
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        finally:
            if pubsub:
                pubsub.unsubscribe()
                pubsub.close()
    
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
