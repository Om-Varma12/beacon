import os
import json
import redis
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


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

        self.client = redis.from_url(redis_url, decode_responses=True)
        self._pubsub = None

    def push_job(self, job_id: int) -> bool:
        """Push job_id to Redis queue."""
        try:
            self.client.lpush(self.queue_name, str(job_id))
            return True
        except Exception as e:
            print(f"Redis error (push_job): {e}")
            return False

    def pop_job(self, timeout: int = 5) -> Optional[int]:
        """Pop job_id from Redis queue (blocking with timeout)."""
        try:
            result = self.client.brpop(self.queue_name, timeout=timeout)
            if result:
                _, job_id_str = result
                return int(job_id_str)
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
            self.client.publish(self.pubsub_channel, json.dumps(event))
            return True
        except Exception as e:
            print(f"Redis error (publish_progress): {e}")
            return False

    def get_pubsub(self):
        """Get Redis pubsub instance for subscribing."""
        if self._pubsub is None:
            self._pubsub = self.client.pubsub()
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
        if self.client:
            self.client.close()


# Global instance
_redis_manager = RedisManager()


def get_redis_manager() -> RedisManager:
    """Get the global Redis manager instance."""
    return _redis_manager
