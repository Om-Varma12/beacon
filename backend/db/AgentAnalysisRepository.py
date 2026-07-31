from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.AgentAnalysis import AgentAnalysis


class AgentAnalysisRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(
        self,
        hackathon_id: int,
        result: dict,
        user_id: int = None
    ):
        analysis = AgentAnalysis(
            hackathon_id=hackathon_id,
            user_id=user_id,
            winner=result.get("winner"),
            leaderboard=result.get("leaderboard", []),
            final_scores=result.get("final_scores", {}),
            winning_idea=result.get("winning_idea", {}),
            synthesized=result.get("synthesized", {}),
        )

        self.session.add(analysis)

        await self.session.flush()

        return analysis.id


    async def create_pending(
        self,
        hackathon_id: int,
        user_id: int = None
    ):
        analysis = AgentAnalysis(
            hackathon_id=hackathon_id,
            user_id=user_id,
            status="PENDING",
            status_message="Initializing analysis pipeline...",
        )

        self.session.add(analysis)

        await self.session.flush()

        return analysis.id


    async def update_status(
        self,
        analysis_id: int,
        status: str,
        status_message: str,
    ):
        stmt = (
            select(AgentAnalysis)
            .where(AgentAnalysis.id == analysis_id)
        )

        result = await self.session.execute(stmt)

        analysis = result.scalar_one_or_none()

        if analysis is None:
            return

        analysis.status = status
        analysis.status_message = status_message


    async def update_results(
        self,
        analysis_id: int,
        result: dict,
        status: str = "COMPLETED",
        status_message: str = "Analysis completed.",
    ):
        stmt = (
            select(AgentAnalysis)
            .where(AgentAnalysis.id == analysis_id)
        )

        result_db = await self.session.execute(stmt)

        analysis = result_db.scalar_one_or_none()

        if analysis is None:
            return

        analysis.winner = result.get("winner")
        analysis.leaderboard = result.get("leaderboard", [])
        analysis.final_scores = result.get("final_scores", {})
        analysis.winning_idea = result.get("winning_idea", {})
        analysis.synthesized = result.get("synthesized", {})
        analysis.status = status
        analysis.status_message = status_message


    async def reset_analysis(self, analysis_id: int):
        stmt = (
            select(AgentAnalysis)
            .where(AgentAnalysis.id == analysis_id)
        )

        result = await self.session.execute(stmt)

        analysis = result.scalar_one_or_none()

        if analysis is None:
            return

        # Delete related AgentRound objects separately
        analysis.winner = None
        analysis.leaderboard = None
        analysis.final_scores = None
        analysis.winning_idea = None
        analysis.synthesized = None
        analysis.status = "PENDING"
        analysis.status_message = (
            "Resetting and starting analysis pipeline..."
        )


    async def get_by_hackathon_id(
        self,
        hackathon_id: int,
        user_id: int = None,
    ):
        stmt = (
            select(AgentAnalysis)
            .where(AgentAnalysis.hackathon_id == hackathon_id)
            .order_by(AgentAnalysis.id.desc())
            .limit(1)
        )

        if user_id is not None:
            stmt = stmt.where(AgentAnalysis.user_id == user_id)
        else:
            stmt = stmt.where(AgentAnalysis.user_id.is_(None))

        result = await self.session.execute(stmt)

        analysis = result.scalar_one_or_none()

        if analysis is None:
            return None

        return {
            "id": analysis.id,
            "hackathon_id": analysis.hackathon_id,
            "user_id": analysis.user_id,
            "winner": analysis.winner,
            "leaderboard": analysis.leaderboard,
            "final_scores": analysis.final_scores,
            "winning_idea": analysis.winning_idea,
            "synthesized": analysis.synthesized,
            "status": analysis.status,
            "status_message": analysis.status_message,
            "created_at": analysis.created_at,
        }