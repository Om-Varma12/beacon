import json
from agents.llm import LLM
from agents.assets_agent import AssetsAgent
from db.HackathonRepository import HackathonRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AssetsRepository import AssetsRepository

class AssetsService:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        analysis_repo: AgentAnalysisRepository,
        assets_repo: AssetsRepository
    ):
        self.hackathon_repo = hackathon_repo
        self.analysis_repo = analysis_repo
        self.assets_repo = assets_repo

    async def get_assets(self, hackathon_id: int):
        # Fetch hackathon to make sure it exists
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            return None

        # Fetch assets
        assets = self.assets_repo.get_by_hackathon_id(hackathon["id"])
        if not assets:
            return {
                "generated": False,
                "doc_content": None,
                "ppt_content": None
            }

        return {
            "generated": True,
            "doc_content": assets.get("doc_content"),
            "ppt_content": assets.get("ppt_content")
        }

    async def generate_assets(self, hackathon_id: int):
        # Fetch hackathon
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            return None

        # Fetch analysis
        analysis = self.analysis_repo.get_by_hackathon_id(hackathon["id"])
        if not analysis:
            raise ValueError("No analysis found for this hackathon. Run analysis first.")

        # Extract winning idea and synthesized details
        winning_idea = analysis.get("winning_idea") or {}
        synthesized = analysis.get("synthesized") or {}

        # Fallback fields
        project_title = (
            synthesized.get("final_project_title") or 
            winning_idea.get("project_title") or 
            "Untitled Solution"
        )
        problem_statement = (
            synthesized.get("final_problem_statement") or 
            winning_idea.get("problem_statement") or 
            "No problem statement available."
        )
        solution_overview = (
            synthesized.get("final_solution_overview") or 
            winning_idea.get("solution_overview") or 
            "No solution overview available."
        )
        core_features = (
            synthesized.get("final_core_features") or 
            winning_idea.get("core_features") or 
            []
        )
        target_users = (
            synthesized.get("final_target_users") or 
            winning_idea.get("target_users") or 
            []
        )
        why_this_is_best = (
            synthesized.get("why_this_is_best") or 
            winning_idea.get("overall_reasoning") or 
            ""
        )

        # Build payload for LLM AssetsAgent
        idea_payload = {
            "project_title": project_title,
            "problem_statement": problem_statement,
            "solution_overview": solution_overview,
            "core_features": core_features,
            "target_users": target_users,
            "why_this_is_best": why_this_is_best
        }

        # Run AssetsAgent to generate technical plan & slides JSON
        llm = LLM()
        assets_agent = AssetsAgent(llm=llm)
        agent_result = await assets_agent.run(json.dumps(idea_payload))

        # Build final Document structure
        doc_content = {
            "title": project_title,
            "problem_statement": problem_statement,
            "solution_overview": solution_overview,
            "core_features": core_features,
            "target_users": target_users,
            "why_this_is_best": why_this_is_best,
            "recommended_tech_stack": agent_result.get("recommended_tech_stack", {}),
            "implementation_phases": agent_result.get("implementation_phases", []),
            "team_structure": agent_result.get("team_structure", []),
            "unique_selling_points": agent_result.get("unique_selling_points", []),
            "risks_and_mitigations": agent_result.get("risks_and_mitigations", []),
            "judging_criteria_alignment": agent_result.get("judging_criteria_alignment", [])
        }

        # Build final Presentation structure
        ppt_content = {
            "title": project_title,
            "organizer": hackathon.get("college_name") or "Hackathon Organizer",
            "slides": agent_result.get("presentation_slides", [])
        }

        # Save to DB
        asset_id = self.assets_repo.create(
            hackathon_id=hackathon["id"],
            doc_content=doc_content,
            ppt_content=ppt_content
        )

        return {
            "id": asset_id,
            "generated": True,
            "doc_content": doc_content,
            "ppt_content": ppt_content
        }
