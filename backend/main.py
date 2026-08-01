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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)