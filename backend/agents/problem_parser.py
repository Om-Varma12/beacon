from agents.base import Agent
from prompts.parser_agent import SYSTEM_PROMPT

class ProblemStatementParserAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT
    
    def build_user_prompt(self, context: str):
        return f"""
            Extract the hackathon problem statement from the following aggregated hackathon context.

            The context may include:
              - hackathon description
              - attached documents (pdf, docx, pptx, txt)
              - linked external resources

            Return the result strictly in the required JSON format.

            AGGREGATED CONTEXT:
            {context}
        """