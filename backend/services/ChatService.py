from agents.chat_llm import ChatLLM
from agents.hackathon_chat_agent import HackathonChatAgent


class ChatService:
    def __init__(
        self,
        hackathon_repo,
        problem_repo,
        resource_repo,
        analysis_repo,
        rounds_repo,
        chat_repo
    ):
        self.hackathon_repo = hackathon_repo
        self.problem_repo = problem_repo
        self.resource_repo = resource_repo
        self.analysis_repo = analysis_repo
        self.rounds_repo = rounds_repo
        self.chat_repo = chat_repo
        self.llm = ChatLLM()


    async def chat(
        self,
        hackathon_id: int,
        message: str
    ):
        # Fetch Hackathon
        hackathon = await self.hackathon_repo.get_by_id(
            hackathon_id
        )
        if not hackathon:
            return None

        internal_hackathon_id = hackathon["id"]

        # Fetch Problem Statements
        problems = (
            await self.problem_repo.get_by_hackathon_id(
                internal_hackathon_id
            )
        )

        # Fetch Resources
        resources = (
            await self.resource_repo.get_by_hackathon_id(
                internal_hackathon_id
            )
        )

        # Fetch Analysis
        analysis = (
            await self.analysis_repo.get_by_hackathon_id(
                internal_hackathon_id
            )
        )

        # Fetch Recent Messages
        recent_messages = (
            await self.chat_repo.get_recent_by_hackathon_id(
                internal_hackathon_id,
                limit=10
            )
        )

        # Save User Message
        await self.chat_repo.create(
            hackathon_id=internal_hackathon_id,
            role="user",
            content=message
        )

        # Build Task Payload
        task = {
            "hackathon": hackathon,
            "problem_statements": problems,
            "resources": resources,
            "analysis": analysis,
            "recent_messages": recent_messages,
            "user_message": message
        }

        # Run Agent
        agent = HackathonChatAgent(
            self.llm
        )
        response = await agent.run(task)

        # Save Assistant Response
        await self.chat_repo.create(
            hackathon_id=internal_hackathon_id,
            role="assistant",
            content=response.get("response", "")
        )

        return response