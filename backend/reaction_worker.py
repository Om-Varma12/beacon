import asyncio
import os
import json
import traceback
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from pathlib import Path

# Load .env
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / '.env')

from db.database import SessionLocal
from utils.redis_manager import get_redis_manager
from models.HackathonReaction import HackathonReaction
from models.Hackathon import Hackathon

async def process_reaction_event(event: dict, session: AsyncSession):
    user_id = event["userId"]
    hackathon_id = event["hackathonId"]
    new_reaction = event["reaction"] # "like", "dislike", or None
    event_created_at_str = event.get("createdAt")
    event_created_at = datetime.fromisoformat(event_created_at_str) if event_created_at_str else datetime.utcnow()

    # 1. Fetch existing reaction
    stmt = select(HackathonReaction).where(
        HackathonReaction.user_id == user_id,
        HackathonReaction.hackathon_id == hackathon_id
    )
    result = await session.execute(stmt)
    existing_reaction_row = result.scalar_one_or_none()

    # 2. Check if event is stale/duplicate
    if existing_reaction_row:
        # If the event's created_at is older than or equal to the row's updated_at, skip it
        if event_created_at <= existing_reaction_row.updated_at:
            print(f"Skipping stale reaction event {event.get('eventId')} (event time {event_created_at} <= db time {existing_reaction_row.updated_at})")
            return

    old_reaction = existing_reaction_row.reaction if existing_reaction_row else None

    if old_reaction == new_reaction:
        return

    # 3. Calculate deltas
    delta_like = 0
    delta_dislike = 0

    if old_reaction == "like":
        delta_like = -1
    elif old_reaction == "dislike":
        delta_dislike = -1

    if new_reaction == "like":
        delta_like += 1
    elif new_reaction == "dislike":
        delta_dislike += 1

    # 4. Update hackathon_reactions
    if new_reaction is None:
        if existing_reaction_row:
            await session.delete(existing_reaction_row)
    else:
        if existing_reaction_row:
            existing_reaction_row.reaction = new_reaction
            existing_reaction_row.updated_at = event_created_at
        else:
            new_row = HackathonReaction(
                user_id=user_id,
                hackathon_id=hackathon_id,
                reaction=new_reaction,
                created_at=event_created_at,
                updated_at=event_created_at
            )
            session.add(new_row)

    # 5. Update counts on hackathons, ensuring they don't fall below 0
    if delta_like != 0 or delta_dislike != 0:
        from sqlalchemy import func
        update_stmt = (
            update(Hackathon)
            .where(Hackathon.id == hackathon_id)
            .values(
                like_count=func.greatest(0, Hackathon.like_count + delta_like),
                dislike_count=func.greatest(0, Hackathon.dislike_count + delta_dislike)
            )
        )
        await session.execute(update_stmt)

    print(f"Processed reaction: user={user_id}, hackathon={hackathon_id}, transition={old_reaction}->{new_reaction}, delta_like={delta_like}, delta_dislike={delta_dislike}")

async def main():
    redis = get_redis_manager()
    print("Reaction worker started, waiting for events...")
    while True:
        try:
            result = await asyncio.to_thread(redis.pop_job, timeout=5, queue_name="beacon:jobs:reactions")
            if result:
                event = json.loads(result)
                print(f"Received reaction event: {event}")
                
                async with SessionLocal() as session:
                    try:
                        await process_reaction_event(event, session)
                        await session.commit()
                    except Exception as e:
                        await session.rollback()
                        print(f"Error processing reaction event: {e}")
                        traceback.print_exc()
        except KeyboardInterrupt:
            print("Reaction worker shutting down...")
            break
        except Exception as e:
            print(f"Error in reaction worker loop: {e}")
            traceback.print_exc()
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
