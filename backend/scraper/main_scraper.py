import asyncio
import httpx
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.database import Database
from scraper.hackathonScraper import scrape_hackathon_detail
from scraper.pageScraper import scrape_pages
from agents.llm import LLM
from agents.problem_parser import ProblemStatementParserAgent


async def scraperHackathons(concurrency: int = 10):
    """
    Scrapes hackathons concurrently, enriches data,
    parses problem statements via the parser agent,
    and stores hackathons + extracted problems in the DB.
    """

    db = Database()
    hack_repo = HackathonRepository(db)
    problem_repo = ProblemRepository(db)

    llm = LLM()
    prbm_parser = ProblemStatementParserAgent(llm)

    semaphore = asyncio.Semaphore(concurrency)

    async def worker(semaphore, client, hackathon):
        async with semaphore:
            enriched = await scrape_hackathon_detail(client, hackathon)

            try:
                hackathon_id = hack_repo.create(enriched)

                if hackathon_id:
                    print(f"Inserted: {enriched['title']} | ID: {hackathon_id}")

                    # Run parser agent on the enriched description
                    description = enriched.get("description") or ""
                    try:
                        parsed = await prbm_parser.run(description)
                    except Exception as e:
                        print(f"Parser agent error for {enriched.get('external_id')}: {e}")
                        parsed = None

                    if parsed:
                        problems = parsed.get("problem_statements")
                        if problems:
                            for p in problems:
                                title = p.get("heading") or p.get("title")
                                desc = p.get("description")
                                p_type = p.get("type")

                                created_id = problem_repo.create(hackathon_id, {
                                    "title": title,
                                    "description": desc,
                                    "type": p_type,
                                })

                                if created_id:
                                    print(f"Inserted problem id={created_id} for hackathon id={hackathon_id}")
                                else:
                                    print(f"Failed to insert problem for hackathon id={hackathon_id}")

                else:
                    print(f"Skipped (duplicate): {enriched['title']}")

            except Exception as e:
                print(f"DB error: {e}")

    async with httpx.AsyncClient() as client:
        tasks = []

        async for hackathon in scrape_pages():
            task = asyncio.create_task(
                worker(semaphore, client, hackathon)
            )
            tasks.append(task)

        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(scraperHackathons())