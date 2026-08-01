"""
Utility to scrape and insert a single hackathon by ID for testing.
Usage:
    asyncio.run(scrape_and_insert_hackathon(123456))
"""

import asyncio
import httpx
from db.database import SessionLocal
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from scraper.hackathonScraper import scrape_hackathon_detail
from agents.llm import LLM
from agents.problem_parser import ProblemStatementParserAgent


async def scrape_and_insert_hackathon(external_id: int):
    """
    Scrapes a single hackathon by its external_id (from Unstop),
    enriches it with details, parses problem statements,
    and inserts both into the database.

    Args:
        external_id: The hackathon ID from Unstop (e.g., 123456)

    Returns:
        A dict with keys:
        - success (bool)
        - hackathon_id (int or None)
        - problems_count (int)
        - message (str)
    """
    async with SessionLocal() as session:
        hack_repo = HackathonRepository(session)
        problem_repo = ProblemRepository(session)

        llm = LLM()
        parser_agent = ProblemStatementParserAgent(llm)

        # Create a minimal hackathon dict to pass to scrape_hackathon_detail
        minimal_hackathon = {
            "external_id": external_id,
            "url": f"https://unstop.com/hackathon/{external_id}",
            "title": f"Hackathon {external_id}",
            "description": "",
        }

        try:
            # Fetch detailed data from Unstop API
            async with httpx.AsyncClient() as client:
                enriched = await scrape_hackathon_detail(client, minimal_hackathon)

            # Insert hackathon into DB
            hackathon_id = await hack_repo.create(enriched)

            if not hackathon_id:
                return {
                    "success": False,
                    "hackathon_id": None,
                    "problems_count": 0,
                    "message": f"Hackathon {external_id} already exists or failed to insert.",
                }

            print(f"✓ Inserted hackathon: {enriched.get('title')} | ID: {hackathon_id}")

            # Parse and insert problem statements
            problems_count = 0
            description = enriched.get("description") or ""

            try:
                parsed = await parser_agent.run(description)
            except Exception as e:
                print(f"⚠ Parser agent error: {e}")
                parsed = None

            if parsed:
                problems = parsed.get("problem_statements")
                if problems:
                    for p in problems:
                        title = p.get("heading") or p.get("title")
                        desc = p.get("description")
                        p_type = p.get("type")

                        created_id = await problem_repo.create(hackathon_id, {
                            "title": title,
                            "description": desc,
                            "type": p_type,
                        })

                        if created_id:
                            problems_count += 1
                            print(f"  ✓ Problem ID {created_id}: {title}")

            await session.commit()
            return {
                "success": True,
                "hackathon_id": hackathon_id,
                "problems_count": problems_count,
                "message": f"Successfully inserted hackathon {external_id} with {problems_count} problem statement(s).",
            }

        except Exception as e:
            await session.rollback()
            return {
                "success": False,
                "hackathon_id": None,
                "problems_count": 0,
                "message": f"Error: {str(e)}",
            }


if __name__ == "__main__":
    # Example usage:
    # python -m utils.scrape_single_hackathon
    result = asyncio.run(scrape_and_insert_hackathon(1648972))
    print(f"\nResult: {result}")
