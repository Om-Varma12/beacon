from agents.base import Agent
from prompts.parser_agent import SYSTEM_PROMPT

class ProblemStatementParserAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT
    
    def build_user_prompt(self, description: str):
        return f"""
            Extract the hackathon problem statement from the following hackathon description.

            Return the result strictly in the required JSON format.

            HACKATHON DESCRIPTION:
            {description}
        """