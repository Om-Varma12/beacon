from agents.ollama_llm import OllamaLLM
from agents.gemini_llm import GeminiLLM
from config import GEMINI_INIT_IDEA_MODEL


class HybridLLM:
    """
    A failover LLM that uses Ollama as the primary provider and Gemini as fallback.

    Failover rules:
    - Ollama rate limit error  →  switch to Gemini and retry immediately.
    - Gemini any error         →  switch back to Ollama and retry immediately.

    The active provider is remembered across calls so that once a switch
    happens it stays on the new provider until the next failover event.
    """

    def __init__(
        self,
        ollama_model: str = "minimax-m3:cloud",
        gemini_model: str = GEMINI_INIT_IDEA_MODEL,
    ):
        self.ollama = OllamaLLM(model=ollama_model)
        self.gemini = GeminiLLM(model=gemini_model)
        self._provider = "ollama"   # starts on Ollama

    @staticmethod
    def _is_rate_limit(error: Exception) -> bool:
        s = str(error).lower()
        return (
            "rate limit" in s
            or "429" in s
            or "too many concurrent" in s
            or "resource_exhausted" in s
            or "quota" in s
        )

    async def generate(self, systemPrompt: str, userPrompt: str) -> str:
        if self._provider == "ollama":
            try:
                return await self.ollama.generate(systemPrompt, userPrompt)
            except Exception as e:
                if self._is_rate_limit(e):
                    print(
                        f"[HybridLLM] Ollama rate limited — "
                        f"switching to Gemini ({self.gemini.model})..."
                    )
                    self._provider = "gemini"
                    # fall through to Gemini call below
                else:
                    raise e

        # provider == "gemini"  OR  we just switched to it above
        try:
            return await self.gemini.generate(systemPrompt, userPrompt)
        except Exception as e:
            print(
                f"[HybridLLM] Gemini error ({e}) — "
                "switching back to Ollama..."
            )
            self._provider = "ollama"
            return await self.ollama.generate(systemPrompt, userPrompt)
