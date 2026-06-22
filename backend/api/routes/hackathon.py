from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from db.database import Database
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.ResourceRepository import ResourceRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AgentRoundsRepository import AgentRoundsRepository
from db.ChatMessageRepository import ChatMessageRepository
from db.AssetsRepository import AssetsRepository
from db.UserRepository import UserRepository

from services.HackathonService import HackathonService
from services.AnalysisService import AnalysisService
from services.ChatService import ChatService
from services.AssetsService import AssetsService

from scraper.main_scraper import scraperHackathons
from utils.auth import get_current_user_claims

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


def get_assets_service():
    hackathon_repo = HackathonRepository(db)
    analysis_repo = AgentAnalysisRepository(db)
    assets_repo = AssetsRepository(db)

    return AssetsService(
        hackathon_repo,
        analysis_repo,
        assets_repo
    )


def get_user_repo():
    return UserRepository(db)


def resolve_user_id(claims: dict, user_repo: UserRepository) -> Optional[int]:
    """Look up (or create) the user in the DB and return their integer id."""
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name") or (email.split("@")[0] if email else None)

    if not cognito_sub or not email:
        return None

    user = user_repo.get_or_create_user(cognito_sub=cognito_sub, email=email, name=name)
    if not user:
        return None

    return user.get("id")
    
    
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
    claims: dict = Depends(get_current_user_claims),
    service: AnalysisService = Depends(get_analysis_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    user_id = resolve_user_id(claims, user_repo)

    data = await service.analyze_hackathon(
        hackathon_id,
        user_id=user_id
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
    claims: dict = Depends(get_current_user_claims),
    service: AnalysisService = Depends(get_analysis_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    user_id = resolve_user_id(claims, user_repo)
    data = service.get_analysis(hackathon_id, user_id=user_id)

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


@router.get("/{hackathon_id}/assets")
async def get_assets(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    service: AssetsService = Depends(get_assets_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    user_id = resolve_user_id(claims, user_repo)
    data = await service.get_assets(hackathon_id, user_id=user_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    return {
        "success": True,
        "data": data
    }


@router.post("/{hackathon_id}/assets/generate")
async def generate_assets(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    service: AssetsService = Depends(get_assets_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    try:
        user_id = resolve_user_id(claims, user_repo)

        data = await service.generate_assets(hackathon_id, user_id=user_id)
        if data is None:
            raise HTTPException(status_code=404, detail="Hackathon not found")

        return {
            "success": True,
            "data": data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assets: {str(e)}")


@router.get("/{hackathon_id}/assets/download/docx")
async def download_assets_docx(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    service: AssetsService = Depends(get_assets_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    user_id = resolve_user_id(claims, user_repo)
    from utils.asset_generator import generate_docx_proposal
    data = await service.get_assets(hackathon_id, user_id=user_id)
    if data is None or not data.get("generated") or not data.get("doc_content"):
        raise HTTPException(status_code=404, detail="Assets not generated yet")
    
    doc_content = data["doc_content"]
    file_stream = generate_docx_proposal(doc_content)
    
    title = doc_content.get('title') or "project"
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_')).rstrip()
    filename = f"{safe_title.lower().replace(' ', '_')}_technical_proposal.docx"
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{hackathon_id}/assets/download/pptx")
async def download_assets_pptx(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    service: AssetsService = Depends(get_assets_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    user_id = resolve_user_id(claims, user_repo)
    from utils.asset_generator import generate_pptx_slides
    data = await service.get_assets(hackathon_id, user_id=user_id)
    if data is None or not data.get("generated") or not data.get("ppt_content"):
        raise HTTPException(status_code=404, detail="Assets not generated yet")
        
    ppt_content = data["ppt_content"]
    file_stream = generate_pptx_slides(ppt_content)
    
    title = ppt_content.get('title') or "project"
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_')).rstrip()
    filename = f"{safe_title.lower().replace(' ', '_')}_pitch_deck.pptx"
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )