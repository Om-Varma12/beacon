from agents.base import Agent
from prompts.assets import SYSTEM_PROMPT

class AssetsAgent(Agent):
    def get_system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, task: str) -> str:
        return f"""
        Analyze this winning idea and generate the technical stack, implementation phases, team structure, USPs, risks & mitigations, and judging criteria alignment:

        WINNING IDEA:
        {task}
        """