from agents.base import Agent
from prompts.idea import SYSTEM_PROMPT

class IdeaAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        return f"""
        Analyze these themes and generate the best possible project idea:

        THEMES:
        {task}
        """