from config import SMALL_MODEL
from agents.grok_manager import GroqKeyManager

import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class ChatLLM():
    def __init__(self):
        self.model = SMALL_MODEL
        self.key_manager = GroqKeyManager()
        self.client = Groq(
            api_key=self.key_manager.get_key()
        )


    def _sync_generate(
        self,
        systemPrompt,
        userPrompt
    ):
        max_retries = len(
            self.key_manager.keys
        )
        
        for _ in range(max_retries):
            try:
                response = (
                    self.client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": systemPrompt
                            },
                            {
                                "role": "user",
                                "content": userPrompt
                            }
                        ],
                        model=self.model
                    )
                )
                return (
                    response
                    .choices[0]
                    .message
                    .content
                )

            except Exception as e:
                error = str(e).lower()
                
                print(f"Groq error: {e}")
                
                if (
                    "rate limit" in error
                    or "quota" in error
                    or "429" in error
                ):
                    print("Switching API key...")
                    self.key_manager.rotate_key()
                    self.client = Groq(
                        api_key=self.key_manager.get_key()
                    )

                else:
                    raise e

        raise Exception(
            "All Groq API keys exhausted."
        )


    async def generate(
        self,
        systemPrompt,
        userPrompt
    ):
        loop = asyncio.get_event_loop()
        
        return await loop.run_in_executor(
            None,
            self._sync_generate,
            systemPrompt,
            userPrompt
        )