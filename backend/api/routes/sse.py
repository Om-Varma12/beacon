from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import asyncio

from db.db_instance import db
from db.HackathonRepository import HackathonRepository
from db.JobRepository import JobRepository
from utils.redis_manager import get_redis_manager
from utils.auth import get_current_user_claims, verify_token

router = APIRouter()

def get_hackathon_repo():
    return HackathonRepository(db)


def get_job_repo():
    return JobRepository(db)


@router.get("/analysis/stream/{job_id}")
async def stream_analysis_status(
    job_id: int,
    token: str = Query(...),
    job_repo: JobRepository = Depends(get_job_repo)
):
    """
    SSE endpoint for real-time job progress updates via Redis Pub/Sub.
    
    Token is passed via query parameter because EventSource doesn't support custom headers.
    """
    # Verify token from query parameter
    claims = verify_token(token)
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
            # Include status_message for frontend compatibility
            yield f"data: {json.dumps({'status': current_status, 'message': current_message, 'status_message': current_message, 'seq': 0})}\n\n"
        
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
            # 1. Subscribe first to ensure no gap between replay and subscription
            pubsub = await redis.subscribe(job_id)
            
            # 2. Fetch and replay all historical progress events in order
            replayed_events = await redis.get_replayed_events(job_id)
            max_sent_seq = 0
            
            for event in replayed_events:
                yield f"data: {json.dumps(event)}\n\n"
                max_sent_seq = max(max_sent_seq, event.get("seq", 0))
            
            # 3. If there are no replayed events, yield the initial queued status
            if max_sent_seq == 0:
                initial_event = {
                    "job_id": job_id,
                    "status": current_status,
                    "message": current_message,
                    "status_message": current_message,
                    "seq": 0
                }
                yield f"data: {json.dumps(initial_event)}\n\n"
            
            # 4. Stream new events from Redis Pub/Sub, deduping by sequence number
            while True:
                # Fully async call - does not block FastAPI thread pool
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=15)
                if message:
                    try:
                        event_data = json.loads(message["data"])
                        seq = event_data.get("seq", 0)
                        
                        # Only deliver events we haven't sent yet
                        if seq > max_sent_seq:
                            yield f"data: {json.dumps(event_data)}\n\n"
                            max_sent_seq = seq
                            
                            # Stop if job is completed or failed
                            if event_data.get("status") in ("completed", "failed", "COMPLETED", "FAILED"):
                                break
                    except json.JSONDecodeError:
                        pass
                else:
                    # Send keepalive every 15 seconds
                    yield ": keepalive\n\n"
                    
        except asyncio.CancelledError:
            print(f"SSE client disconnected for job_id: {job_id}")
            raise
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"SSE connection error for job_id: {job_id}:\n{error_trace}")
            
            # Differentiate transport/redis stream errors from upstream job failures
            error_data = {
                'status': 'STREAM_ERROR',
                'message': f'SSE stream error: {str(e)}',
                'status_message': f'SSE stream error: {str(e)}'
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        finally:
            if pubsub:
                await pubsub.unsubscribe()
                await pubsub.close()
    
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
