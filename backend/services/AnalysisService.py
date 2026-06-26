from agents.ollama_llm import OllamaLLM
from orchestrator.pipeline import DebatePipeline
from utils.sse_queue import get_sse_queue


class AnalysisService:
    def __init__(self, hackathon_repo, problem_repo, analysis_repo, rounds_repo):
        self.hackathon_repo = hackathon_repo
        self.problem_repo = problem_repo
        self.analysis_repo = analysis_repo
        self.rounds_repo = rounds_repo


    async def analyze_hackathon(self, hackathon_id: int, user_id: int = None):
        # Fetch Hackathon
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None

        internal_hackathon_id = hackathon["id"]


        # Fetch Problem Statements
        problems = self.problem_repo.get_by_hackathon_id(internal_hackathon_id)


        # Build Theme Payload
        themes = []

        for problem in problems:
            themes.append({
                "title": problem.get("title"),
                "description": problem.get("description"),
                "type": problem.get("type")
            })


        # Run Debate Pipeline
        llm = OllamaLLM()

        pipeline = DebatePipeline(
            llm=llm,
            debate_rounds=2,
            use_synthesizer=True
        )

        result = await pipeline.run(theme=themes)


        # Save Main Analysis
        analysis_id = self.analysis_repo.create(
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
            self.rounds_repo.create(
                analysis_id=analysis_id,
                round_number=idx + 1,
                data=round_data,
                user_id=user_id
            )


        return {
            "analysis_id": analysis_id,
            "result": result
        }
        
    def get_or_create_pending_analysis(self, hackathon_id: int, user_id: int = None):
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            return None

        internal_hackathon_id = hackathon["id"]

        # Check if one already exists
        analysis = self.analysis_repo.get_by_hackathon_id(
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
                self.analysis_repo.reset_analysis(analysis["id"])
                return {
                    "analysis_id": analysis["id"],
                    "status": "PENDING",
                    "status_message": "Resetting and starting analysis pipeline...",
                    "should_start": True
                }
        else:
            # Create a new pending analysis row
            analysis_id = self.analysis_repo.create_pending(
                internal_hackathon_id,
                user_id=user_id
            )
            return {
                "analysis_id": analysis_id,
                "status": "PENDING",
                "status_message": "Initializing analysis pipeline...",
                "should_start": True
            }

    async def run_async_analysis_pipeline(self, analysis_id: int, hackathon_id: int, user_id: int = None):
        sse_queue = get_sse_queue()
        try:
            # 1. Update status to RUNNING
            status_message = "Preparing and loading hackathon problem statements..."
            self.analysis_repo.update_status(
                analysis_id,
                "RUNNING",
                status_message
            )
            # Publish to SSE queue
            await sse_queue.publish(analysis_id, "RUNNING", status_message)

            # Fetch Hackathon
            hackathon = self.hackathon_repo.get_by_id(hackathon_id)
            if not hackathon:
                raise ValueError("Hackathon not found")

            internal_hackathon_id = hackathon["id"]

            # Fetch Problem Statements
            problems = self.problem_repo.get_by_hackathon_id(internal_hackathon_id)

            # Build Theme Payload
            themes = []
            for problem in problems:
                themes.append({
                    "title": problem.get("title"),
                    "description": problem.get("description"),
                    "type": problem.get("type")
                })

            if not themes:
                themes.append({
                    "title": hackathon.get("title", "General Theme"),
                    "description": hackathon.get("description", ""),
                    "type": "general"
                })

            # Run Debate Pipeline
            llm = OllamaLLM()
            pipeline = DebatePipeline(
                llm=llm,
                debate_rounds=2,
                use_synthesizer=True
            )

            # Callback to update progress in DB and publish to SSE
            async def on_progress(message: str):
                self.analysis_repo.update_status(
                    analysis_id,
                    "RUNNING",
                    message
                )
                await sse_queue.publish(analysis_id, "RUNNING", message)

            # Run the pipeline
            result = await pipeline.run(theme=themes, on_progress=on_progress)

            # 2. Save Main Analysis
            status_message = "Analysis completed successfully."
            self.analysis_repo.update_results(
                analysis_id,
                result,
                status="COMPLETED",
                status_message=status_message
            )
            await sse_queue.publish(analysis_id, "COMPLETED", status_message)

            # 3. Save Rounds
            rounds = result.get("rounds", [])
            for idx, round_data in enumerate(rounds):
                self.rounds_repo.create(
                    analysis_id=analysis_id,
                    round_number=idx + 1,
                    data=round_data,
                    user_id=user_id
                )

        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = f"Analysis failed: {str(e)}"
            self.analysis_repo.update_status(
                analysis_id,
                "FAILED",
                error_msg
            )
            await sse_queue.publish(analysis_id, "FAILED", error_msg)

    def get_analysis(self, hackathon_id: int, user_id: int = None):
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None

        analysis = self.analysis_repo.get_by_hackathon_id(
            hackathon["id"],
            user_id=user_id
        )

        if not analysis:
            return {}

        rounds = self.rounds_repo.get_by_analysis_id(
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