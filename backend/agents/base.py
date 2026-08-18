import json
from langsmith import traceable

class Agent:
    def __init__(self, llm, name="agent"):
        self.llm = llm
        self.name = name

    # @traceable
    async def run(self, task: str) -> dict:
        response = await self.llm.generate(
            self.get_system_prompt(),
            self.build_user_prompt(task)
        )

        return self.parse_response(response)

    def get_system_prompt(self) -> str:
        raise NotImplementedError

    def build_user_prompt(self, task: str) -> str:
        raise NotImplementedError

    def parse_response(self, response: dict) -> dict:
        if isinstance(response, dict):
            return response
        if isinstance(response, (str, bytes, bytearray)):
            return json.loads(response)
        raise TypeError(f"Unexpected response type: {type(response)}")