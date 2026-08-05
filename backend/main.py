import os
from fastapi import FastAPI
from api.router import router as main_router
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine

app = FastAPI()

app.include_router(main_router)

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown."""
    await engine.dispose()
    print("Database connections closed.")


# ---------------------------------------------------------------------------
# CORS — explicit allowed origins.
# allow_credentials=True + allow_origins=["*"] is rejected by browsers.
# Add your production frontend URL to ALLOWED_ORIGINS env var (comma-separated).
# ---------------------------------------------------------------------------
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)