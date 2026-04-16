class Agent:
    def __init__(self, llm, name="agent"):
        self.llm = llm
        self.name = name

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
        return response