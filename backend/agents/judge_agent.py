import json

from agents.base import Agent
from prompts.judge import SYSTEM_PROMPT


class JudgeAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        payload = task if isinstance(task, str) else json.dumps(task, indent=2)
        return f"""
        Evaluate this debate round payload.

        TASK JSON:
        {payload}
        """
