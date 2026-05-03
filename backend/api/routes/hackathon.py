import asyncio
from fastapi import APIRouter, Depends

from db.database import Database
from db.HackathonRepository import HackathonRepository
from scraper.mainScaper import scraperHackathons

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

@router.post('/scrape-hackathons')
async def scrape_hackathon():
    try:
        await scraperHackathons()

        return {
            "success": True
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }