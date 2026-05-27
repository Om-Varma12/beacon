from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from pydantic import BaseModel

from db.database import Database
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.ResourceRepository import ResourceRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AgentRoundsRepository import AgentRoundsRepository
from db.ChatMessageRepository import ChatMessageRepository

from services.HackathonService import HackathonService
from services.AnalysisService import AnalysisService
from services.ChatService import ChatService

from scraper.main_scraper import scraperHackathons

router = APIRouter()


# Create one DB instance
db = Database()


class ChatModel(BaseModel):
    message: str

# Dependency
def get_repo():
    return HackathonRepository(db)


def get_service():
    hackathon_repo = HackathonRepository(db)
    problem_repo = ProblemRepository(db)
    resource_repo = ResourceRepository(db)
    
    return HackathonService(
        hackathon_repo,
        problem_repo,
        resource_repo,
    )


def get_analysis_service():
    hackathon_repo = HackathonRepository(db)
    problem_repo = ProblemRepository(db)
    analysis_repo = AgentAnalysisRepository(db)
    rounds_repo = AgentRoundsRepository(db)

    return AnalysisService(
        hackathon_repo,
        problem_repo,
        analysis_repo,
        rounds_repo
    )
    

def get_chat_service():
    hackathon_repo = HackathonRepository(db)
    problem_repo = ProblemRepository(db)
    resource_repo = ResourceRepository(db)
    analysis_repo = AgentAnalysisRepository(db)
    rounds_repo = AgentRoundsRepository(db)
    chat_repo = ChatMessageRepository(db)

    return ChatService(
        hackathon_repo,
        problem_repo,
        resource_repo,
        analysis_repo,
        rounds_repo,
        chat_repo
    )
    
    
#                                 Routes                                       #    
#------------------------------------------------------------------------------#


@router.get("/")
def get_hackathons(
    repo: HackathonRepository = Depends(get_repo),
    limit: int = Query(12, le=100),
    offset: int = 0,
    sort_by: str = "start_date",
    order: str = "asc"
):
    try:
        data = repo.get_all(limit, offset, sort_by, order)
        total_count = repo.get_total_active_count()

        return {
            "success": True,
            "count": total_count,
            "page_count": len(data),
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


@router.get("/{hackathon_id}")
def get_hackathon(
    hackathon_id: int,
    service: HackathonService = Depends(get_service)
):
    data = service.get_hackathon_detail(hackathon_id)

    if data is None:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    return {
        "success": True,
        "data": data
    }
    
    
@router.post("/{hackathon_id}/analyze")
async def analyze_hackathon(
    hackathon_id: int,
    service: AnalysisService = Depends(get_analysis_service)
):
    data = await service.analyze_hackathon(
        hackathon_id
    )

    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    return {
        "success": True,
        "data": data
    }
    
    
@router.get("/{hackathon_id}/analysis")
def get_analysis(
    hackathon_id: int,
    service: AnalysisService = Depends(get_analysis_service)
):
    data = service.get_analysis(hackathon_id)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    return {
        "success": True,
        "data": data
    }
    

@router.post("/{hackathon_id}/chat")
async def chat_with_hackathon(
    hackathon_id: int,
    body: ChatModel,
    service: ChatService = Depends(get_chat_service)
):
    data = await service.chat(
        hackathon_id=hackathon_id,
        message=body.message
    )

    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    return {
        "success": True,
        "data": data
    }