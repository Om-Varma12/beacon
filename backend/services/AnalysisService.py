from agents.llm import LLM
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


        # Fetch Problem Statements
        problems = self.problem_repo.get_by_hackathon_id(hackathon_id)


        # Build Theme Payload
        themes = []

        for problem in problems:
            themes.append({
                "title": problem.get("title"),
                "description": problem.get("description"),
                "type": problem.get("type")
            })


        # Run Debate Pipeline
        llm = LLM()

        pipeline = DebatePipeline(
            llm=llm,
            debate_rounds=2,
            use_synthesizer=True
        )

        result = await pipeline.run(theme=themes)


        # Save Main Analysis
        analysis_id = self.analysis_repo.create(
            hackathon_id,
            result
        )


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