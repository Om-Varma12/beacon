from agents.base import Agent
from prompts.tech import SYSTEM_PROMPT

class TechAgents(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task, context):
        return f"""
        Evaluate the following theme from a BUSINESS perspective.

        THEME:
        {task}

        CONTEXT:
        {context}

        Return JSON:
        {{
            "score": 0-10,
            "pros": [],
            "cons": [],
            "reasoning": "...",
            "confidence": 0-1
        }}
        """