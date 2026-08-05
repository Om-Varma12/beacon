from agents.base import Agent
from prompts.parser_agent import SYSTEM_PROMPT

class ProblemStatementParserAgent(Agent):
    def get_system_prompt(self):
        return SYSTEM_PROMPT

    def build_user_prompt(self, context: str):
        return f"""
Below is the raw aggregated hackathon context. It may contain HTML markup, plain text, extracted PDF/doc content, and external resource text all combined together.

YOUR TASK:
1. Mentally strip all HTML tags and read the actual text content within them.
2. Scan the ENTIRE context from top to bottom — do not skip any section, paragraph, bullet point, or heading.
3. Look for keywords: "Problem Statement", "PS", "PS1", "Track", "Challenge", "Build", "Develop", "Create", "Solve", "Objective", "Task".
4. Extract ALL problem statements, tracks, and defined challenges you find as separate items.
5. Assign the correct "type" to each item: "problem_statement" or "open_innovation".
6. Return ONLY raw JSON as per the schema. No extra text, no markdown.

AGGREGATED CONTEXT:
{context}
        """