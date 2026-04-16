import json

from agents.base import Agent
from prompts.practical_idea import SYSTEM_PROMPT


class PracticalIdeaAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        payload = task if isinstance(task, str) else json.dumps(task, indent=2)
        return f"""
        Execute your role as the PRACTICAL idea persona.

        TASK JSON:
        {payload}
        """

    def parse_response(self, response):
        parsed = super().parse_response(response)
        parsed.setdefault("agent_persona", "practical")
        return parsed
