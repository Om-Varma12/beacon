import asyncio
import time
from typing import Dict, AsyncIterator, Optional
from dataclasses import dataclass


@dataclass
class SSEEvent:
    analysis_id: int
    status: str
    status_message: str
    timestamp: float


class SSEQueue:
    _instance: Optional['SSEQueue'] = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        # analysis_id -> queue of events
        self._queues: Dict[int, asyncio.Queue] = {}
        # analysis_id -> list of subscriber timestamps for cleanup
        self._subscribers: Dict[int, float] = {}
        # Cleanup stale subscriptions after 30 minutes
        self._cleanup_interval = 30 * 60
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup_task(self):
        """Start background task to clean up stale subscriptions."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        """Periodically clean up stale subscriptions."""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self._cleanup_stale_subscriptions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"SSEQueue cleanup error: {e}")

    async def _cleanup_stale_subscriptions(self):
        """Remove subscriptions that haven't been updated recently."""
        current_time = time.time()
        stale_ids = [
            analysis_id 
            for analysis_id, timestamp in self._subscribers.items()
            if current_time - timestamp > self._cleanup_interval
        ]
        
        for analysis_id in stale_ids:
            await self.unsubscribe(analysis_id)
            print(f"Cleaned up stale subscription for analysis_id: {analysis_id}")

    async def subscribe(self, analysis_id: int) -> asyncio.Queue:
        """Subscribe to events for a specific analysis."""
        async with self._lock:
            if analysis_id not in self._queues:
                self._queues[analysis_id] = asyncio.Queue()
            self._subscribers[analysis_id] = time.time()
            await self.start_cleanup_task()
            return self._queues[analysis_id]

    async def unsubscribe(self, analysis_id: int):
        """Unsubscribe from events for a specific analysis."""
        async with self._lock:
            if analysis_id in self._queues:
                del self._queues[analysis_id]
            if analysis_id in self._subscribers:
                del self._subscribers[analysis_id]

    async def publish(self, analysis_id: int, status: str, status_message: str):
        """Publish an event for a specific analysis."""
        event = SSEEvent(
            analysis_id=analysis_id,
            status=status,
            status_message=status_message,
            timestamp=time.time()
        )
        
        async with self._lock:
            if analysis_id in self._queues:
                queue = self._queues[analysis_id]
                try:
                    await queue.put(event)
                except asyncio.QueueFull:
                    print(f"Queue full for analysis_id: {analysis_id}, dropping event")

    async def get_events(self, analysis_id: int) -> AsyncIterator[SSEEvent]:
        """Get an async iterator for events from a specific analysis."""
        queue = await self.subscribe(analysis_id)
        
        try:
            while True:
                event = await queue.get()
                yield event
                # Stop yielding if analysis is completed or failed
                if event.status in ("COMPLETED", "FAILED"):
                    break
        except asyncio.CancelledError:
            raise
        finally:
            await self.unsubscribe(analysis_id)


# Global instance
_sse_queue = SSEQueue()


def get_sse_queue() -> SSEQueue:
    """Get the global SSE queue instance."""
    return _sse_queue
