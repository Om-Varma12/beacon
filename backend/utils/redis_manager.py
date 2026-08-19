import os
import json
import redis
import redis.asyncio as aioredis
from typing import Optional, List, Dict

# Load .env from backend directory
from pathlib import Path
from dotenv import load_dotenv
backend_dir = Path(__file__).parent.parent
load_dotenv(backend_dir / '.env')


class RedisManager:
    _instance: Optional['RedisManager'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.queue_name = os.getenv("REDIS_QUEUE_NAME", "beacon:jobs")

        # Create separate clients for queue and pubsub operations
        # Queue client: sync client used exclusively for blocking BRPOP/LPUSH job-queue operations.
        # All pub/sub and progress publishing uses the async pubsub_client.
        self.queue_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=None,
            socket_connect_timeout=5,
            health_check_interval=30
        )
        # Pubsub client: async client for non-blocking SSE, pub/sub, and progress publishing
        self.pubsub_client = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=None,
            socket_connect_timeout=5,
            health_check_interval=30
        )

    def push_job(self, job_id: int | str, queue_name: Optional[str] = None) -> bool:
        """Push job_id to Redis queue."""
        try:
            q = queue_name or self.queue_name
            self.queue_client.lpush(q, str(job_id))
            return True
        except Exception as e:
            print(f"Redis error (push_job): {e}")
            return False

    def pop_job(self, timeout: int = 0, queue_name: Optional[str] = None) -> Optional[str]:
        """Pop job_id/payload from Redis queue (blocking with timeout)."""
        try:
            q = queue_name or self.queue_name
            result = self.queue_client.brpop(q, timeout=timeout)
            if result:
                _, job_id_str = result
                return job_id_str
            return None
        except redis.exceptions.TimeoutError:
            # Timeout is expected when using timeout > 0
            return None
        except Exception as e:
            print(f"Redis error (pop_job): {e}")
            return None

    async def publish_progress(self, job_id: int, status: str, message: str) -> bool:
        """
        Publish progress event to a per-job Redis Pub/Sub channel and append to a durable list.
        Uses the async pubsub_client so it is non-blocking.
        """
        try:
            # 1. Increment sequence number
            seq_key = f"beacon:events:{job_id}:seq"
            seq = await self.pubsub_client.incr(seq_key)
            if seq == 1:
                await self.pubsub_client.expire(seq_key, 3600)  # 1 hour TTL
            
            # 2. Build the event payload
            # Both "message" and "status_message" are included for frontend compatibility.
            event = {
                "job_id": job_id,
                "status": status,
                "message": message,
                "status_message": message,
                "seq": seq
            }
            event_str = json.dumps(event)
            
            # 3. Append to the durable events list
            list_key = f"beacon:events:{job_id}"
            await self.pubsub_client.rpush(list_key, event_str)
            await self.pubsub_client.expire(list_key, 3600)  # 1 hour TTL
            
            # 4. Publish to the per-job channel
            channel_key = f"beacon:progress:{job_id}"
            await self.pubsub_client.publish(channel_key, event_str)
            return True
        except Exception as e:
            import traceback
            print(f"Redis error (publish_progress) for job {job_id}: {e}")
            traceback.print_exc()
            return False

    async def get_replayed_events(self, job_id: int) -> List[Dict]:
        """
        Fetch all replayed events from the durable list for a job.
        Uses the async pubsub_client so it doesn't block the async loop.
        """
        try:
            list_key = f"beacon:events:{job_id}"
            events = await self.pubsub_client.lrange(list_key, 0, -1)
            return [json.loads(e) for e in events]
        except Exception as e:
            print(f"Error fetching replayed events for job {job_id}: {e}")
            return []

    async def subscribe(self, job_id: int):
        """
        Create and return a new independent async Redis pubsub instance.
        Each SSE connection gets its own pubsub object.
        """
        pubsub = self.pubsub_client.pubsub()
        await pubsub.subscribe(f"beacon:progress:{job_id}")
        return pubsub

    async def close(self):
        """Close Redis connections."""
        if self.queue_client:
            self.queue_client.close()
        if self.pubsub_client:
            await self.pubsub_client.close()


# Global instance
_redis_manager = RedisManager()


def get_redis_manager() -> RedisManager:
    """Get the global Redis manager instance."""
    return _redis_manager
