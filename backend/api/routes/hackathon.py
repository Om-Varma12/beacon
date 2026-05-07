import asyncio
from fastapi import APIRouter, Depends, Query, BackgroundTasks

from db.database import Database
from db.HackathonRepository import HackathonRepository
from backend.scraper.main_scraper import scraperHackathons

router = APIRouter()


# Create one DB instance
db = Database()


# Dependency
def get_repo():
    return HackathonRepository(db)


@router.get("")
def get_hackathons(
    repo: HackathonRepository = Depends(get_repo),
    limit: int = Query(12, le=100),
    offset: int = 0,
    sort_by: str = "start_date",
    order: str = "asc"
):
    try:
        data = repo.get_all(limit, offset, sort_by, order)

        return {
            "success": True,
            "count": len(data),
            "data": data
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/scrape-hackathons")
async def scrape_hackathon(background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(scraperHackathons)

        return {
            "success": True,
            "message": "Scraping started in background"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }