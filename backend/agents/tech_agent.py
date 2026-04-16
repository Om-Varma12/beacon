from agents.base import Agent
from prompts.tech import SYSTEM_PROMPT

class TechAgents(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        return f"""
        Evaluate the following project idea from a TECHNOLOGY perspective.

        TASK:
        {task}
        """