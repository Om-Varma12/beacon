# Like / Dislike Reactions

## Overview

Beacon lets users like or dislike a hackathon.

The public sees aggregate counts.

Logged-in users see their own current reaction reflected in the UI.

Who liked or disliked what is never exposed.

---

# Problem

Reactions need to be:

* Fast to submit (user expects instant feedback)
* Accurate over time (counts should reflect reality)
* Idempotent (clicking rapidly should not corrupt counts)

A naive approach — writing directly to the database on every click — fails under rapid interaction.

Example:

A user clicks like, then dislike, then like again within two seconds.

Three concurrent writes race against each other.

Counts may end up wrong.

---

# Design

The solution separates the write path into two stages.

Stage 1: Accept the request immediately, push an event to a Redis queue, return to the user.

Stage 2: A background worker reads from the queue, resolves the correct delta, and updates the database atomically.

This is a simple producer-consumer queue pattern.

---

# Database

## hackathons table

Two columns were added:

```sql
like_count    INTEGER NOT NULL DEFAULT 0
dislike_count INTEGER NOT NULL DEFAULT 0
```

These are the public-facing numbers.

## hackathon_reactions table

A separate table tracks each user's current reaction:

```sql
CREATE TABLE hackathon_reactions (
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hackathon_id INTEGER REFERENCES hackathons(id) ON DELETE CASCADE,
    reaction     VARCHAR(10) CHECK (reaction IN ('like', 'dislike')),
    created_at   TIMESTAMP DEFAULT now(),
    updated_at   TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, hackathon_id)
);
```

The composite primary key enforces one row per user per hackathon.

It is physically impossible to insert duplicate reactions.

This table is internal. It is used only by the worker to compute correct deltas.

---

# API

## GET /hackathons/{id}

This endpoint is now optionally authenticated.

Without a token it works as before. Counts are included.

With a valid token the backend resolves the user and queries their current reaction:

```json
{
  "like_count": 42,
  "dislike_count": 3,
  "my_reaction": "like"
}
```

`my_reaction` is `null` when the user has not reacted.

## PUT /hackathons/{id}/reaction

Requires authentication.

Body:

```json
{ "reaction": "like" }
```

Or to remove a reaction:

```json
{ "reaction": null }
```

The endpoint does not write to the database.

It creates a JSON event and pushes it to Redis:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 7,
  "hackathonId": 123,
  "reaction": "like",
  "createdAt": "2026-08-19T14:30:00"
}
```

It returns immediately after the Redis write.

The entire request takes roughly one millisecond regardless of database load.

---

# Redis Queue

A dedicated queue is used:

```text
beacon:jobs:reactions
```

This is separate from the existing `beacon:jobs` queue used by the scraping worker.

Separating the queues means reaction processing cannot be delayed by a long-running scrape job.

---

# Reaction Worker

A standalone async Python process reads from the queue continuously.

The processing logic for each event:

```text
1. Pop event from beacon:jobs:reactions

2. Fetch existing reaction for (user_id, hackathon_id)

3. If event.createdAt <= existing.updated_at:
       skip — this event is stale or out of order

4. Compute delta:
       old=like,  new=dislike → delta_like=-1, delta_dislike=+1
       old=like,  new=None    → delta_like=-1
       old=None,  new=like    → delta_like=+1
       ...

5. Upsert hackathon_reactions:
       insert or update the row

6. Update hackathons:
       like_count    = GREATEST(0, like_count + delta_like)
       dislike_count = GREATEST(0, dislike_count + delta_dislike)

7. Commit
```

Steps 5 and 6 run inside a single transaction.

`GREATEST(0, ...)` ensures counts never go negative due to any edge case.

---

# Why a Timestamp on Every Event

The `createdAt` field is written by the frontend at the moment the user makes their decision.

The worker compares this against `updated_at` on the existing row.

If the event is older than the last processed event, it is skipped.

Example:

User clicks like at 14:30:00, then dislike at 14:30:03.

Two events are in the queue:

```text
event A: reaction=like,    createdAt=14:30:00
event B: reaction=dislike, createdAt=14:30:03
```

If event B is processed first, event A is skipped because its timestamp is earlier.

The final state is dislike, which is correct.

Without this check, the older event could overwrite the newer one.

---

# Frontend

## Data Flow

The hackathon detail page:

1. Fetches `GET /hackathons/{id}` with an Authorization header when the user is logged in.
2. Maps `data.my_reaction` into the view model.
3. Syncs local state from the server value when data loads.

The query key includes the user token so React Query automatically refetches when the user logs in or out.

## Optimistic UI

The displayed counts update instantly without waiting for the API.

The server already includes the user's own reaction in the counts.

So the delta is computed as:

```text
displayedLikeCount =
  server.likeCount
  + (localPreference === "like" ? 1 : 0)
  - (serverMyReaction === "like" ? 1 : 0)
```

This avoids double-counting.

## Debounce

Five clicks produce one API request.

When the user clicks, a five-second timer starts.

Each subsequent click resets the timer.

When the timer fires, the current preference is sent to the API.

```text
click like    → start 5s timer
click dislike → reset timer
click like    → reset timer
              ↓ 5 seconds pass
PUT /reaction { reaction: "like" }
```

This reduces API noise and matches how users actually behave — they explore options before settling.

## Flush on Leave

The pending reaction must not be lost if the user navigates away before the timer fires.

Two mechanisms handle this:

React component unmount: the cleanup function runs `flushReaction()` immediately.

Browser tab close or refresh: a `beforeunload` event listener runs a `fetch` call with `keepalive: true`, which the browser sends even after the page is unloading.

---

# Optional Authentication Pattern

`GET /hackathons/{id}` should work for anonymous users and return `my_reaction` for logged-in users.

Standard FastAPI auth dependencies raise a 401 if no token is present.

A new `get_optional_user_claims` dependency was added that uses `HTTPBearer(auto_error=False)`.

It returns `None` if no token is present instead of raising an error.

The route checks whether claims are present before resolving a user:

```python
user_id = None
if claims:
    user_id = await resolve_user_id(claims, user_repo)

data = await service.get_hackathon_detail(hackathon_id, user_id=user_id)
```

---

# Running the Worker

Locally:

```bash
python reaction_worker.py
```

In Docker (already added to docker-compose.yml):

```bash
docker compose up reaction-worker
```

---

# Final Design

Beacon uses:

* A Redis queue to decouple the write from the database update.
* A background worker to process events serially per-user.
* Event timestamps to handle out-of-order delivery.
* A composite primary key to enforce one reaction per user per hackathon.
* Frontend debounce to collapse rapid clicks into a single API request.
* `keepalive: true` to flush pending reactions on page unload.

This design provides:

* Sub-millisecond API response times.
* Correct counts under concurrent access.
* Clean user experience with instant feedback.
* No data loss on page close.
