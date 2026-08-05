import asyncio
import json
import random
import re
import os
import time

from google import genai
from dotenv import load_dotenv

from config import GEMINI_INIT_IDEA_MODEL

load_dotenv()


class GeminiLLM:
    def __init__(self, model: str = GEMINI_INIT_IDEA_MODEL):
        self.model = model
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def _sync_generate(self, system_prompt: str, user_prompt: str) -> str:
        max_retries = 3
        # Instruct the model to return raw JSON only
        system_prompt_json_warn = (
            system_prompt
            + "\n\nCRITICAL: You must return your response as a single, valid JSON object "
            "matching the requested schema. Do not output markdown code blocks or any "
            "introductory/concluding text. Only output the raw JSON string starting with "
            "'{' and ending with '}'."
        )
        full_prompt = f"{system_prompt_json_warn}\n\n{user_prompt}"

        for attempt in range(max_retries):
            try:
                interaction = self.client.interactions.create(
                    model=self.model,
                    input=full_prompt,
                )
                raw = interaction.output_text
                if not raw:
                    raise ValueError("Empty response received from Gemini model.")

                extracted = self._extract_json(raw)
                # Validate early so we can retry on bad JSON
                json.loads(extracted)
                return extracted

            except Exception as e:
                print(f"Gemini attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise e

                error_str = str(e).lower()
                is_rate_limit = (
                    "rate limit" in error_str
                    or "429" in error_str
                    or "quota" in error_str
                    or "resource_exhausted" in error_str
                )

                wait_time = random.randint(1, 15) if is_rate_limit else 1
                if is_rate_limit:
                    print(f"Rate limit detected, waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract JSON from LLM output that may contain
        markdown fences or extra prose."""
        # Try ```json ... ``` blocks first
        match = re.search(
            r"```(?:json)?\s*\n?(.*?)\n?\s*```",
            text,
            re.DOTALL,
        )
        if match:
            return match.group(1).strip()

        # Fall back to finding the outermost { } or [ ]
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end > start:
                return text[start : end + 1]

        return text.strip()

    async def generate(self, systemPrompt: str, userPrompt: str) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._sync_generate,
            systemPrompt,
            userPrompt,
        )
