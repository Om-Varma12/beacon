from fastapi import APIRouter, Depends
from db.database import Database
from db.HackathonRepository import HackathonRepository

router = APIRouter()


# Create one DB instance
db = Database()


# Dependency
def get_repo():
    return HackathonRepository(db)


@router.get("/hackathons")
def get_hackathons(
    repo: HackathonRepository = Depends(get_repo)
):

    data = repo.get_all()

    return {
        "success": True,
        "data": data
    }