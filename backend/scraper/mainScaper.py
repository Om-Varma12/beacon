import asyncio
import httpx
from db.HackathonRepository import HackathonRepository
from db.database import Database
from scraper.hackathonScraper import scrape_hackathon_detail
from scraper.pageScraper import scrape_pages


async def scraperHackathons(concurrency: int = 10):
    """
    Scrapes hackathons concurrently, enriches data,
    and stores them in the database.
    """

    async def worker(semaphore, client, repo, hackathon):
        async with semaphore:
            enriched = await scrape_hackathon_detail(client, hackathon)

            try:
                hackathon_id = repo.create(enriched)

                if hackathon_id:
                    print(f"Inserted: {enriched['title']} | ID: {hackathon_id}")
                else:
                    print(f"Skipped (duplicate): {enriched['title']}")

            except Exception as e:
                print(f"DB error: {e}")

    db = Database()
    repo = HackathonRepository(db)

    semaphore = asyncio.Semaphore(concurrency)

    async with httpx.AsyncClient() as client:
        tasks = []

        async for hackathon in scrape_pages():
            task = asyncio.create_task(
                worker(semaphore, client, repo, hackathon)
            )
            tasks.append(task)

        await asyncio.gather(*tasks)
        
# if __name__ == "__main__":
#     asyncio.run(scraperHackathons())