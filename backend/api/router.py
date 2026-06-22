from fastapi import APIRouter
from api.routes import hackathon
from api.routes import health
from api.routes import user

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