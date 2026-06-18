from agents.ollama_llm import OllamaLLM
from orchestrator.pipeline import DebatePipeline


class AnalysisService:
    def __init__(self, hackathon_repo, problem_repo, analysis_repo, rounds_repo):
        self.hackathon_repo = hackathon_repo
        self.problem_repo = problem_repo
        self.analysis_repo = analysis_repo
        self.rounds_repo = rounds_repo


    async def analyze_hackathon(self, hackathon_id: int):
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
            result
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
                data=round_data
            )


        return {
            "analysis_id": analysis_id,
            "result": result
        }
        
    def get_analysis(self, hackathon_id: int):
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None

        analysis = self.analysis_repo.get_by_hackathon_id(
            hackathon["id"]
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
            "result": result
        }