import json

from agents.base import Agent
from prompts.synthesizer import SYSTEM_PROMPT


class SynthesizerAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, task):
        payload = task if isinstance(task, str) else json.dumps(task, indent=2)
        return f"""
        Synthesize the final concept from this payload.

        TASK JSON:
        {payload}
        """
