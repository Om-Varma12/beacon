from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from db.database import SessionLocal
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.ResourceRepository import ResourceRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AgentRoundsRepository import AgentRoundsRepository
from db.ChatMessageRepository import ChatMessageRepository
from db.AssetsRepository import AssetsRepository
from db.UserRepository import UserRepository
from db.JobRepository import JobRepository

from services.HackathonService import HackathonService
from services.AnalysisService import AnalysisService
from services.ChatService import ChatService
from services.AssetsService import AssetsService

from scraper.main_scraper import scraperHackathons
from utils.auth import get_current_user_claims
from utils.redis_manager import get_redis_manager

router = APIRouter()


class ChatModel(BaseModel):
    message: str


async def get_session():
    async with SessionLocal() as session:
        yield session

        
# Dependency
def get_repo(
    session: AsyncSession = Depends(get_session),
):
    return HackathonRepository(session)


async def get_service(
    session: AsyncSession = Depends(get_session),
):
    hackathon_repo = HackathonRepository(session)
    problem_repo = ProblemRepository(session)
    resource_repo = ResourceRepository(session)

    return HackathonService(
        hackathon_repo,
        problem_repo,
        resource_repo,
    )


async def get_analysis_service(
    session: AsyncSession = Depends(get_session),
):
    hackathon_repo = HackathonRepository(session)
    problem_repo = ProblemRepository(session)
    analysis_repo = AgentAnalysisRepository(session)
    rounds_repo = AgentRoundsRepository(session)

    return AnalysisService(
        hackathon_repo,
        problem_repo,
        analysis_repo,
        rounds_repo
    )
    

async def get_chat_service(
    session: AsyncSession = Depends(get_session),
):
    hackathon_repo = HackathonRepository(session)
    problem_repo = ProblemRepository(session)
    resource_repo = ResourceRepository(session)
    analysis_repo = AgentAnalysisRepository(session)
    rounds_repo = AgentRoundsRepository(session)
    chat_repo = ChatMessageRepository(session)

    return ChatService(
        hackathon_repo,
        problem_repo,
        resource_repo,
        analysis_repo,
        rounds_repo,
        chat_repo
    )


async def get_assets_service(
    session: AsyncSession = Depends(get_session),
):
    hackathon_repo = HackathonRepository(session)
    analysis_repo = AgentAnalysisRepository(session)
    assets_repo = AssetsRepository(session)

    return AssetsService(
        hackathon_repo,
        analysis_repo,
        assets_repo
    )


async def get_user_repo(
    session: AsyncSession = Depends(get_session),
):
    return UserRepository(session)


async def get_job_repo(
    session: AsyncSession = Depends(get_session),
):
    return JobRepository(session)


async def resolve_user_id(claims: dict, user_repo: UserRepository) -> Optional[int]:
    """Look up (or create) the user in the DB and return their integer id."""
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name") or (email.split("@")[0] if email else None)

    if not cognito_sub or not email:
        return None

    user = await user_repo.get_or_create_user(cognito_sub=cognito_sub, email=email, name=name)
    if not user:
        return None

    return user.get("id")
    
    
#                                 Routes                                       #    
#------------------------------------------------------------------------------#


@router.get("/")
async def get_hackathons(
    repo: HackathonRepository = Depends(get_repo),
    limit: int = Query(12, le=100),
    offset: int = 0,
    sort_by: str = "start_date",
    order: str = "asc"
):
    try:
        data = await repo.get_all(limit, offset, sort_by, order)
        total_count = await repo.get_total_active_count()

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
async def get_hackathon(
    hackathon_id: int,
    service: HackathonService = Depends(get_service)
):
    data = await service.get_hackathon_detail(hackathon_id)

    if data is None:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    return {
        "success": True,
        "data": data
    }
    
    
@router.post("/{hackathon_id}/analyze", status_code=202)
async def analyze_hackathon(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    user_repo: UserRepository = Depends(get_user_repo),
    job_repo: JobRepository = Depends(get_job_repo),
    service: AnalysisService = Depends(get_analysis_service)
):
    user_id = await resolve_user_id(claims, user_repo)
    redis = get_redis_manager()

    analysis_data = await service.get_or_create_pending_analysis(
        hackathon_id,
        user_id=user_id
    )

    if analysis_data is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    analysis_id = analysis_data["analysis_id"]

    # Create job record with analysis_id in payload
    payload = {
        "hackathon_id": hackathon_id,
        "user_id": user_id,
        "analysis_id": analysis_id
    }
    job_id = await job_repo.create("analysis", payload)

    if job_id is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to create job"
        )

    # Explicitly commit the transaction so that the worker (and SSE stream) can see the job in the DB immediately
    await job_repo.session.commit()

    # Push job to Redis queue
    if not redis.push_job(job_id):
        raise HTTPException(
            status_code=500,
            detail="Failed to queue job"
        )

    return {
        "success": True,
        "data": {
            "job_id": job_id,
            "status": "queued",
            "status_message": "Job queued for processing"
        }
    }
    
    
@router.get("/{hackathon_id}/analysis")
async def get_analysis(
    hackathon_id: int,
    claims: dict = Depends(get_current_user_claims),
    service: AnalysisService = Depends(get_analysis_service),
    user_repo: UserRepository = Depends(get_user_repo),
    job_repo: JobRepository = Depends(get_job_repo)
):
    user_id = await resolve_user_id(claims, user_repo)
    data = await service.get_analysis(hackathon_id, user_id=user_id)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    # If the analysis is still running, attach the active job_id so
    # the frontend can reconnect its SSE stream after a page reload.
    status = data.get("status") if data else None
    if status in ("PENDING", "RUNNING"):
        active_job = await job_repo.get_active_job_for_hackathon(hackathon_id, user_id=user_id)
        if active_job:
            data["job_id"] = active_job["id"]

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
    user_id = await resolve_user_id(claims, user_repo)
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
        user_id = await resolve_user_id(claims, user_repo)

        data = await service.generate_assets(hackathon_id, user_id=user_id)
        if data is None:
            raise HTTPException(status_code=404, detail="Hackathon not found")

        # Explicitly commit the session before returning the response
        # to ensure the client GET request fetches the committed assets
        await service.assets_repo.session.commit()

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
    user_id = await resolve_user_id(claims, user_repo)
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
    user_id = await resolve_user_id(claims, user_repo)
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
