import asyncio
import json
from datetime import datetime
from pprint import pprint
from agents.llm import LLM
from orchestrator.pipeline import DebatePipeline
from utils.attachment_downloader import download


async def main():
    themes = download()
    llm = LLM()
    pipeline = DebatePipeline(llm=llm, debate_rounds=2, use_synthesizer=True)

    result = await pipeline.run(theme=themes)

    print("\n=== FINAL RESULT ===")
    pprint(result, sort_dicts=False)

    print("\n=== FINAL LEADERBOARD ===")
    pprint(result.get("leaderboard", []), sort_dicts=False)

    print("\n=== WINNER ===")
    pprint(result.get("winner"), sort_dicts=False)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"debate_result_{timestamp}.json"

    with open('debate-results/' + json_filename, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    print(f"\nSaved JSON log to: {json_filename}")


if __name__ == "__main__":
    asyncio.run(main())