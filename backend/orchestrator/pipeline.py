import asyncio
from typing import Any

from agents.business_idea_agent import BusinessIdeaAgent
from agents.innovation_idea_agent import InnovationIdeaAgent
from agents.judge_agent import JudgeAgent
from agents.practical_idea_agent import PracticalIdeaAgent
from agents.synthesizer_agent import SynthesizerAgent


PERSONAS = ("practical", "innovation", "business")


class DebatePipeline:
	def __init__(self, llm, debate_rounds: int = 2, use_synthesizer: bool = True):
		self.idea_agents = {
			"practical": PracticalIdeaAgent(llm),
			"innovation": InnovationIdeaAgent(llm),
			"business": BusinessIdeaAgent(llm),
		}
		self.judge = JudgeAgent(llm)
		self.use_synthesizer = use_synthesizer
		self.synthesizer = SynthesizerAgent(llm) if use_synthesizer else None
		self.debate_rounds = max(1, debate_rounds)

	async def run(self, theme: Any) -> dict:
		history: list[dict] = []
		ideas = await self._run_generation_round(theme)
		judge_result = await self._run_judge(
			round_number=1,
			ideas=ideas,
			debates=[],
			previous_scores=None,
		)
		history.append(
			{
				"round": 1,
				"phase": "generation",
				"ideas": ideas,
				"judge": judge_result,
			}
		)

		critiques_received: dict[str, list[dict]] = {persona: [] for persona in PERSONAS}
		current_ideas = ideas

		for round_number in range(2, 2 + self.debate_rounds):
			debates = await self._run_debate_round(
				round_number=round_number,
				theme=theme,
				ideas=current_ideas,
				critiques_received=critiques_received,
				judge_feedback=judge_result,
			)
			critiques_received = self._collect_targeted_critiques(debates)
			current_ideas = self._extract_improved_ideas(debates, current_ideas)
			judge_result = await self._run_judge(
				round_number=round_number,
				ideas=current_ideas,
				debates=list(debates.values()),
				previous_scores=judge_result.get("scores", {}),
			)

			history.append(
				{
					"round": round_number,
					"phase": "debate",
					"debates": debates,
					"ideas": current_ideas,
					"judge": judge_result,
				}
			)

		winner = self._pick_winner(judge_result)
		result = {
			"winner": winner,
			"leaderboard": judge_result.get("leaderboard", []),
			"final_scores": judge_result.get("scores", {}),
			"winning_idea": current_ideas.get(winner, {}),
			"rounds": history,
		}

		if self.synthesizer:
			synthesis_payload = {
				"winner": winner,
				"leaderboard": judge_result.get("leaderboard", []),
				"final_scores": judge_result.get("scores", {}),
				"final_ideas": current_ideas,
				"debate_history": history,
			}
			result["synthesized"] = await self.synthesizer.run(synthesis_payload)

		return result

	async def _run_generation_round(self, theme: Any) -> dict[str, dict]:
		payload = {
			"round": 1,
			"round_type": "generate",
			"theme": theme,
			"instructions": "Generate your strongest project idea using your persona.",
		}
		outputs = await asyncio.gather(
			self.idea_agents["practical"].run(payload),
			self.idea_agents["innovation"].run(payload),
			self.idea_agents["business"].run(payload),
		)

		ideas: dict[str, dict] = {}
		for persona, output in zip(PERSONAS, outputs):
			idea = dict(output)
			idea["agent_persona"] = persona
			ideas[persona] = idea

		return ideas

	async def _run_debate_round(
		self,
		round_number: int,
		theme: Any,
		ideas: dict[str, dict],
		critiques_received: dict[str, list[dict]],
		judge_feedback: dict,
	) -> dict[str, dict]:
		tasks = []
		for persona in PERSONAS:
			competitors = [ideas[other] for other in PERSONAS if other != persona]
			payload = {
				"round": round_number,
				"round_type": "debate",
				"theme": theme,
				"own_idea": ideas[persona],
				"competitor_ideas": competitors,
				"critiques_received": critiques_received.get(persona, []),
				"judge_feedback": judge_feedback.get("feedback", {}).get(persona, ""),
				"previous_scores": judge_feedback.get("scores", {}),
				"instructions": "Defend your idea, critique competitors, and return an improved idea.",
			}
			tasks.append(self.idea_agents[persona].run(payload))

		outputs = await asyncio.gather(*tasks)
		debates: dict[str, dict] = {}
		for persona, output in zip(PERSONAS, outputs):
			debate = dict(output)
			debate.setdefault("agent_persona", persona)
			debate.setdefault("defense", "")
			debate.setdefault("criticisms_of_competitors", [])
			improved = debate.get("improved_idea", {})
			if not isinstance(improved, dict) or not improved:
				improved = ideas[persona]
			improved["agent_persona"] = persona
			debate["improved_idea"] = improved
			debates[persona] = debate

		return debates

	async def _run_judge(
		self,
		round_number: int,
		ideas: dict[str, dict],
		debates: list[dict],
		previous_scores: dict | None,
	) -> dict:
		payload = {
			"round": round_number,
			"all_ideas": [ideas[persona] for persona in PERSONAS],
			"all_debates": debates,
			"previous_scores": previous_scores,
		}
		result = await self.judge.run(payload)
		result.setdefault("scores", {})
		result.setdefault("feedback", {})

		for persona in PERSONAS:
			if persona not in result["scores"]:
				result["scores"][persona] = 0
			if persona not in result["feedback"]:
				result["feedback"][persona] = "No feedback returned."

		leaderboard = result.get("leaderboard", [])
		if not isinstance(leaderboard, list) or not leaderboard:
			leaderboard = sorted(
				PERSONAS,
				key=lambda p: result["scores"].get(p, 0),
				reverse=True,
			)
		result["leaderboard"] = leaderboard

		return result

	@staticmethod
	def _collect_targeted_critiques(debates: dict[str, dict]) -> dict[str, list[dict]]:
		critiques: dict[str, list[dict]] = {persona: [] for persona in PERSONAS}
		for source_persona, debate in debates.items():
			for item in debate.get("criticisms_of_competitors", []):
				if not isinstance(item, dict):
					continue
				target = item.get("target_agent")
				if target in critiques:
					critiques[target].append(
						{
							"from_agent": source_persona,
							"critique": item.get("critique", ""),
						}
					)
		return critiques

	@staticmethod
	def _extract_improved_ideas(debates: dict[str, dict], current_ideas: dict[str, dict]) -> dict[str, dict]:
		improved: dict[str, dict] = {}
		for persona in PERSONAS:
			debate = debates.get(persona, {})
			improved_idea = debate.get("improved_idea", {})
			if isinstance(improved_idea, dict) and improved_idea:
				improved_idea["agent_persona"] = persona
				improved[persona] = improved_idea
			else:
				improved[persona] = current_ideas[persona]
		return improved

	@staticmethod
	def _pick_winner(judge_result: dict) -> str:
		leaderboard = judge_result.get("leaderboard", [])
		if isinstance(leaderboard, list):
			for entry in leaderboard:
				if entry in PERSONAS:
					return entry

		scores = judge_result.get("scores", {})
		return max(PERSONAS, key=lambda p: scores.get(p, 0))
