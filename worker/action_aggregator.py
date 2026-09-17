import asyncio
import os
import json
import traceback
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
backend_dir = Path(__file__).parent.parent / 'backend'
load_dotenv(backend_dir / '.env')

from backend.db.database import SessionLocal
from backend.db.JobRepository import JobRepository
from backend.utils.redis_manager import get_redis_manager

class ActionAggregator:
    def __init__(self):
        self.redis = get_redis_manager()
        # Async client for pubsub and weight management
        # We use the pubsub_client from redis_manager which is already aioredis
        self.async_redis = self.redis.pubsub_client
        self.queue_name = "beacon:jobs:actions"

    async def run(self):
        """Main entry point for the aggregator."""
        print("Action Aggregator started. Listening for events and expiries...")

        # Start both the consumer and the expiry listener concurrently
        await asyncio.gather(
            self._consume_actions(),
            self._listen_for_expiries()
        )

    async def _consume_actions(self):
        """Consumes events from beacon:jobs:actions and aggregates weights."""
        print("Action consumer loop running...")
        while True:
            try:
                # Use asyncio.to_thread for the blocking brpop from the sync queue_client
                # or use the async pubsub_client.
                # The redis_manager has a sync queue_client for pop_job.
                job_id_str = await asyncio.to_thread(self.redis.pop_job, queue_name=self.queue_name)

                if not job_id_str:
                    continue

                event = json.loads(job_id_str)
                user_id = event.get("userId")
                hackathon_id = event.get("hackathonId")
                weight = event.get("weight", 0.0)

                if not user_id or not hackathon_id:
                    print(f"Invalid event received: {event}")
                    continue

                # Keys
                weight_key = f"session_weight:{user_id}:{hackathon_id}"
                timer_key = f"session_timer:{user_id}:{hackathon_id}"

                # 1. Aggregated Weight (Capped at 1.0)
                # Get current weight
                current_weight_str = await self.async_redis.get(weight_key)
                current_weight = float(current_weight_str) if current_weight_str else 0.0

                new_weight = min(1.0, current_weight + weight)

                # 2. Update Redis
                # weight_key: Store the value, TTL = 31 minutes (slightly longer than timer)
                await self.async_redis.set(weight_key, new_weight, ex=1860)
                # timer_key: Just a trigger for expiry, TTL = 30 minutes
                await self.async_redis.set(timer_key, "1", ex=1800)

                # print(f"Aggregated weight for user {user_id} on hackathon {hackathon_id}: {new_weight}")

            except Exception as e:
                print(f"Error in action consumer: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def _listen_for_expiries(self):
        """Listens for Redis keyspace notifications for session_timer keys."""
        print("Expiry listener loop running...")
        pubsub = await self.async_redis.pubsub()
        # Subscribe to expired events.
        # Note: Redis config 'notify-keyspace-events Ex' must be enabled.
        await pubsub.subscribe("__keyevent@0__:expired")

        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if not message:
                    await asyncio.sleep(0.1)
                    continue

                # message is a dict: {'type': 'message', 'data': b'session_timer:7:123'}
                key_name = message['data'].decode('utf-8')

                if key_name.startswith("session_timer:"):
                    # Extract user_id and hackathon_id
                    parts = key_name.split(":")
                    if len(parts) != 3:
                        continue

                    user_id = int(parts[1])
                    hackathon_id = int(parts[2])

                    # Fetch final aggregated weight from the weight_key
                    weight_key = f"session_weight:{user_id}:{hackathon_id}"
                    final_weight_str = await self.async_redis.get(weight_key)

                    if final_weight_str:
                        final_weight = float(final_weight_str)
                        print(f"Session expired for user {user_id} on hackathon {hackathon_id}. Final weight: {final_weight}. Enqueuing cluster update...")

                        # Handoff to Postgres jobs table
                        await self._enqueue_cluster_job(user_id, hackathon_id, final_weight)

                        # Clean up the weight key
                        await self.async_redis.delete(weight_key)
                    else:
                        print(f"Timer expired but no weight found for {user_id}:{hackathon_id}")

            except Exception as e:
                print(f"Error in expiry listener: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def _enqueue_cluster_job(self, user_id: int, hackathon_id: int, weight: float):
        """Creates a job record in the database for cluster updating."""
        async with SessionLocal() as session:
            try:
                job_repo = JobRepository(session)
                payload = {
                    "user_id": user_id,
                    "hackathon_id": hackathon_id,
                    "weight": weight
                }
                job_id = await job_repo.create("update_user_cluster", payload)
                if job_id:
                    print(f"Successfully enqueued update_user_cluster job {job_id}")
                else:
                    print("Failed to create cluster update job in database")
                await session.commit()
            except Exception as e:
                print(f"Database error during cluster job enqueue: {e}")
                await session.rollback()

if __name__ == "__main__":
    async def main():
        aggregator = ActionAggregator()
        try:
            await aggregator.run()
        except KeyboardInterrupt:
            print("Aggregator shutting down...")

    print("Starting Action Aggregator...")
    asyncio.run(main())
