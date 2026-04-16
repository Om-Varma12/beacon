from agents.base import Agent
from prompts.innovation import SYSTEM_PROMPT

class InnovationAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        return f"""
        Evaluate the following project idea from an INNOVATION perspective.

        TASK:
        {task}
        """