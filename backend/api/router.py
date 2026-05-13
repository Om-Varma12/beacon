from fastapi import APIRouter
from api.routes import hackathon

router = APIRouter()

router.include_router(
    hackathon.router,
    prefix="/hackathons",
    tags=["Hackathon"]
)

router.include_router(
    hackathon.router,
    prefix="/hackathon",
    tags=["Hackathon"]
)