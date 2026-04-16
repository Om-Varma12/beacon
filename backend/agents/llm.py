import asyncio
from config import MODEL
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

class LLM():
    def __init__(self):
        self.model = MODEL
        self.client = Groq()
        
    ## retry logic to add yet!!
    def _sync_generate(self, systemPrompt, userPrompt):
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": userPrompt}
            ],
            model=self.model,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content
        
        
    async def generate(self, systemPrompt, userPrompt):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            # Means: use the default thread pool executor
            # Python will automatically manage threads for us
            self._sync_generate,
            systemPrompt,  # these are the parameter given to
            userPrompt     # _sync_generate function above
        )