# Beacon Backend

Backend API for the Beacon hackathon platform.

## Requirements

- Python 3.10+
- PostgreSQL database
- At least one `GROQ_API_KEY_<n>` environment variable

## Environment Variables

Create a `.env` file in `backend/` with at least:

- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY_1` - first Groq API key
- `GROQ_API_KEY_2` - optional additional key for rotation

If you use more keys, continue the numbering pattern.

## Install

Using `uv`:

```bash
uv sync
```

Using `pip`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

Start the API with Uvicorn:

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you are using a virtual environment instead of `uv`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Useful Endpoints

- `GET /health` - checks database and LLM connectivity
- `GET /hackathons` - lists hackathons
- `GET /hackathons/{hackathon_id}` - fetches a hackathon
- `POST /hackathons/{hackathon_id}/analyze` - runs analysis
- `GET /hackathons/{hackathon_id}/analysis` - fetches saved analysis
- `POST /hackathons/{hackathon_id}/chat` - chats about a hackathon

## Notes

- The API now uses the plural `/hackathons` prefix consistently.
- The health check performs a simple `SELECT 1` on PostgreSQL and a minimal Groq chat completion request.