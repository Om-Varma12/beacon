import json

from agents.base import Agent
from prompts.business import SYSTEM_PROMPT

class BusinessAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        return f"""
        Evaluate the following project idea from a BUSINESS perspective.

        TASK:
        {task}
        """
        
    def parse_response(self, response):
        return {
            "agent": "business",
            **json.loads(response)
        }