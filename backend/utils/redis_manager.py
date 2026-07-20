import os
import json
import redis
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
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
        self.pubsub_channel = os.getenv("REDIS_PUBSUB_CHANNEL", "beacon:progress")

        # Create separate clients for queue and pubsub operations
        # Queue client: for LPUSH/BRPOP operations
        self.queue_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=None,
            socket_connect_timeout=5,
            health_check_interval=30
        )
        # Pubsub client: for publishing and subscribing
        self.pubsub_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=None,
            socket_connect_timeout=5,
            health_check_interval=30
        )
        self._pubsub = None

    def push_job(self, job_id: int) -> bool:
        """Push job_id to Redis queue."""
        try:
            self.queue_client.lpush(self.queue_name, str(job_id))
            return True
        except Exception as e:
            print(f"Redis error (push_job): {e}")
            return False

    def pop_job(self, timeout: int = 0) -> Optional[int]:
        """Pop job_id from Redis queue (blocking with timeout)."""
        try:
            result = self.queue_client.brpop(self.queue_name, timeout=timeout)
            if result:
                _, job_id_str = result
                return int(job_id_str)
            return None
        except redis.exceptions.TimeoutError:
            # Timeout is expected when using timeout > 0
            return None
        except Exception as e:
            print(f"Redis error (pop_job): {e}")
            return None

    def publish_progress(self, job_id: int, status: str, message: str) -> bool:
        """Publish progress event to Redis Pub/Sub."""
        try:
            event = {
                "job_id": job_id,
                "status": status,
                "message": message
            }
            self.pubsub_client.publish(self.pubsub_channel, json.dumps(event))
            return True
        except Exception as e:
            print(f"Redis error (publish_progress): {e}")
            return False

    def get_pubsub(self):
        """Get Redis pubsub instance for subscribing."""
        if self._pubsub is None:
            self._pubsub = self.pubsub_client.pubsub()
        return self._pubsub

    def subscribe(self, job_id: int):
        """Subscribe to progress channel for a specific job."""
        pubsub = self.get_pubsub()
        pubsub.subscribe(self.pubsub_channel)
        return pubsub

    def close(self):
        """Close Redis connections."""
        if self._pubsub:
            self._pubsub.close()
        if self.queue_client:
            self.queue_client.close()
        if self.pubsub_client:
            self.pubsub_client.close()


# Global instance
_redis_manager = RedisManager()


def get_redis_manager() -> RedisManager:
    """Get the global Redis manager instance."""
    return _redis_manager
