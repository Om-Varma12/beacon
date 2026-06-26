from fastapi import APIRouter
from api.routes import hackathon
from api.routes import health
from api.routes import user
from api.routes import sse

router = APIRouter()

router.include_router(
    hackathon.router,
    prefix="/hackathons",
    tags=["Hackathon"]
)

router.include_router(
    user.router,
    tags=["User"]
)

router.include_router(
    health.router,
    tags=["Health"]
)

router.include_router(
    sse.router,
    prefix="/hackathons",
    tags=["SSE"]
)