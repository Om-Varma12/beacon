import asyncio
import json
import random
import re
from ollama import chat

class OllamaLLM:
    def __init__(self, model="minimax-m3:cloud"):
        self.model = model

    def _sync_generate(self, system_prompt, user_prompt):
        max_retries = 3
        # We also instruct the LLM to output valid JSON within the prompt wrapper to assist the model
        system_prompt_json_warn = (
            system_prompt 
            + "\n\nCRITICAL: You must return your response as a single, valid JSON object matching the requested schema. Do not output any thinking block in the final content (the system handles thinking). Do not output markdown code blocks or any introductory/concluding text. Only output the raw JSON string starting with '{' and ending with '}'."
        )
        
        for attempt in range(max_retries):
            try:
                response = chat(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt_json_warn},
                        {"role": "user", "content": user_prompt},
                    ],
                    think=True,
                    stream=False,
                )
                raw = response.message.content
                if not raw:
                    raise ValueError("Empty response received from Ollama model.")
                
                extracted = self._extract_json(raw)
                # Let's validate if it's loadable JSON to throw an error early for retry
                json.loads(extracted)
                return extracted
            except Exception as e:
                print(f"Ollama attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise e
                
                # Check if it's a rate limit error
                error_str = str(e).lower()
                is_rate_limit = "rate limit" in error_str or "429" in error_str or "too many concurrent" in error_str
                
                if is_rate_limit:
                    # Use random wait between 1-15 seconds for rate limit errors
                    wait_time = random.randint(1, 15)
                    print(f"Rate limit detected, waiting {wait_time} seconds before retry...")
                    import time
                    time.sleep(wait_time)
                else:
                    # Standard 1 second wait for other errors
                    import time
                    time.sleep(1)

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract JSON from LLM output that may contain
        markdown fences or thinking artifacts."""
        # Try to find ```json ... ``` blocks first
        match = re.search(
            r"```(?:json)?\s*\n?(.*?)\n?\s*```",
            text, re.DOTALL
        )
        if match:
            return match.group(1).strip()

        # Try to find raw JSON object/array
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end > start:
                return text[start : end + 1]

        return text.strip()

    async def generate(self, systemPrompt, userPrompt):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._sync_generate,
            systemPrompt,
            userPrompt,
        )
