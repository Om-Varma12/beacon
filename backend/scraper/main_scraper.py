import asyncio

import httpx

from agents.llm import LLM
from agents.problem_parser import ProblemStatementParserAgent

from db.database import SessionLocal
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.ResourceRepository import ResourceRepository

from scraper.hackathonScraper import scrape_hackathon_detail
from scraper.pageScraper import scrape_pages

from services.problem_context_builder import ProblemContextBuilder


async def scraperHackathons(concurrency: int = 10):
    """
    Scrapes hackathons concurrently, enriches data,
    parses problem statements via the parser agent,
    and stores hackathons + extracted problems in the DB.
    """

    llm = LLM()
    prbm_parser = ProblemStatementParserAgent(llm)

    semaphore = asyncio.Semaphore(concurrency)

    async def worker(semaphore, client, hackathon):
        async with semaphore:
            enriched = await scrape_hackathon_detail(client, hackathon)

            async with SessionLocal() as session:
                hack_repo = HackathonRepository(session)
                problem_repo = ProblemRepository(session)
                resource_repo = ResourceRepository(session)

                try:
                    hackathon_id = await hack_repo.create(enriched)

                    if hackathon_id:
                        print(
                            f"Inserted: {enriched['title']} | ID: {hackathon_id}"
                        )

                        # Insert resources
                        resources = enriched.get("resources", [])

                        for resource in resources:
                            resource_id = await resource_repo.create(
                                hackathon_id,
                                resource,
                            )

                            if resource_id:
                                print(
                                    f"Inserted resource id={resource_id}"
                                )
                            else:
                                print(
                                    "Failed resource insert "
                                    f"for hackathon id={hackathon_id}"
                                )

                        # Build unified context and parse problems
                        context_builder = ProblemContextBuilder()

                        try:
                            combined = await context_builder.build(
                                enriched
                            )

                            combined_context = (
                                combined.get("combined_context") or ""
                            )

                            parsed = await prbm_parser.run(
                                combined_context
                            )

                        except Exception as e:
                            print(
                                "Parser agent error for "
                                f"{enriched.get('external_id')}: {e}"
                            )

                            parsed = None

                        # Insert problem statements
                        if parsed:
                            problems = parsed.get(
                                "problem_statements"
                            )

                            if problems:
                                for p in problems:
                                    title = (
                                        p.get("heading")
                                        or p.get("title")
                                    )

                                    desc = p.get("description")
                                    p_type = p.get("type")

                                    created_id = (
                                        await problem_repo.create(
                                            hackathon_id,
                                            {
                                                "title": title,
                                                "description": desc,
                                                "type": p_type,
                                            },
                                        )
                                    )

                                    if created_id:
                                        print(
                                            "Inserted problem "
                                            f"id={created_id} "
                                            f"for hackathon "
                                            f"id={hackathon_id}"
                                        )
                                    else:
                                        print(
                                            "Failed to insert "
                                            f"problem for hackathon "
                                            f"id={hackathon_id}"
                                        )

                    else:
                        print(
                            f"Skipped (duplicate): "
                            f"{enriched['title']}"
                        )

                    await session.commit()

                except Exception as e:
                    await session.rollback()
                    print(f"DB error: {e}")

    async with httpx.AsyncClient() as client:
        tasks = []

        async for hackathon in scrape_pages():
            tasks.append(
                asyncio.create_task(
                    worker(
                        semaphore,
                        client,
                        hackathon,
                    )
                )
            )

        await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(scraperHackathons())