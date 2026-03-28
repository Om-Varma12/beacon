class Agent:
    def __init__(self, llm, name="agent"):
        self.llm = llm
        self.name = name

    async def run(self, task: str, context: str = "") -> dict:
        system_prompt = self.get_system_prompt()
        user_prompt = self.build_user_prompt(task, context)

        response = await self.llm.generate(system_prompt, user_prompt)

        return self.format_output(response)

    def get_system_prompt(self):
        return "You are a helpful AI agent."

    def build_user_prompt(self, task, context):
        return """
            TASK:
            {task}

            CONTEXT:
            {context}

            Return output in JSON format:
            {
                "output": "...",
                "reasoning": "..."
            }
        """

    def format_output(self, response: dict) -> dict:
        return {
            "status": "success",
            "output": response.get("output", ""),
            "reasoning": response.get("reasoning", ""),
            "confidence": response.get("confidence", 0.5)
        }