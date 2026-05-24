import json

from agents.base import Agent
from prompts.hackathon_chat import SYSTEM_PROMPT


class HackathonChatAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT


    def build_user_prompt(self, task):
        payload = (
            task
            if isinstance(task, str)
            else json.dumps(task, indent=2)
        )

        return f"""
        You are assisting the user with this hackathon.

        Use the provided hackathon context, previous conversation,
        and analysis data to answer the user intelligently.

        TASK JSON:
        {payload}
        """


    def parse_response(self, response):
        parsed = super().parse_response(response)

        return {
            "agent": "hackathon_chat",
            **parsed
        }