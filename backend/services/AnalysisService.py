from agents.hybrid_llm import HybridLLM
from orchestrator.pipeline import DebatePipeline


class AnalysisService:
    def __init__(self, hackathon_repo, problem_repo, analysis_repo, rounds_repo):
        self.hackathon_repo = hackathon_repo
        self.problem_repo = problem_repo
        self.analysis_repo = analysis_repo
        self.rounds_repo = rounds_repo


    async def analyze_hackathon(self, hackathon_id: int, user_id: int = None):
        # Fetch Hackathon
        hackathon = await self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None

        internal_hackathon_id = hackathon["id"]


        # Fetch Problem Statements
        problems = await self.problem_repo.get_by_hackathon_id(internal_hackathon_id)


        # Build Theme Payload
        themes = []

        for problem in problems:
            themes.append({
                "title": problem.get("title"),
                "description": problem.get("description"),
                "type": problem.get("type")
            })


        # Run Debate Pipeline
        llm = HybridLLM()

        pipeline = DebatePipeline(
            llm=llm,
            debate_rounds=2,
            use_synthesizer=True
        )

        result = await pipeline.run(theme=themes)


        # Save Main Analysis
        analysis_id = await self.analysis_repo.create(
            internal_hackathon_id,
            result,
            user_id=user_id
        )

        if not analysis_id:
            return {
                "analysis_id": None,
                "result": result
            }


        # Save Rounds
        rounds = result.get("rounds", [])

        for idx, round_data in enumerate(rounds):
            await self.rounds_repo.create(
                analysis_id=analysis_id,
                round_number=idx + 1,
                data=round_data,
                user_id=user_id
            )


        return {
            "analysis_id": analysis_id,
            "result": result
        }
        
    async def get_or_create_pending_analysis(self, hackathon_id: int, user_id: int = None):
        hackathon = await self.hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            return None

        internal_hackathon_id = hackathon["id"]

        # Check if one already exists
        analysis = await self.analysis_repo.get_by_hackathon_id(
            internal_hackathon_id,
            user_id=user_id
        )

        if analysis:
            status = analysis.get("status", "COMPLETED")
            if status in ("PENDING", "RUNNING"):
                return {
                    "analysis_id": analysis["id"],
                    "status": status,
                    "status_message": analysis.get("status_message"),
                    "should_start": False
                }
            else:
                # Reset existing analysis row for a re-run
                await self.analysis_repo.reset_analysis(analysis["id"])
                return {
                    "analysis_id": analysis["id"],
                    "status": "PENDING",
                    "status_message": "Resetting and starting analysis pipeline...",
                    "should_start": True
                }
        else:
            # Create a new pending analysis row
            analysis_id = await self.analysis_repo.create_pending(
                internal_hackathon_id,
                user_id=user_id
            )
            return {
                "analysis_id": analysis_id,
                "status": "PENDING",
                "status_message": "Initializing analysis pipeline...",
                "should_start": True
            }

    async def get_analysis(self, hackathon_id: int, user_id: int = None):
        hackathon = await self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None

        analysis = await self.analysis_repo.get_by_hackathon_id(
            hackathon["id"],
            user_id=user_id
        )

        if not analysis:
            return {}

        rounds = await self.rounds_repo.get_by_analysis_id(
            analysis["id"]
        )

        result = {
            "winner": analysis.get("winner"),
            "leaderboard": analysis.get("leaderboard"),
            "final_scores": analysis.get("final_scores"),
            "winning_idea": analysis.get("winning_idea"),
            "synthesized": analysis.get("synthesized"),
            "rounds": rounds
        }

        return {
            "analysis_id": analysis["id"],
            "status": analysis.get("status"),
            "status_message": analysis.get("status_message"),
            "result": result
        }