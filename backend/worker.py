import asyncio
import os
import traceback
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / '.env')

from db.database import SessionLocal
from db.JobRepository import JobRepository
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AgentRoundsRepository import AgentRoundsRepository
from db.AssetsRepository import AssetsRepository

from scraper.main_scraper import scraperHackathons
from services.AssetsService import AssetsService

from utils.redis_manager import get_redis_manager
from agents.ollama_llm import OllamaLLM
from orchestrator.pipeline import DebatePipeline


class Worker:
    def __init__(self):
        self.redis = get_redis_manager()
        
        # Configuration
        self.max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))
        self.retry_backoff_base = int(os.getenv("WORKER_RETRY_BACKOFF_BASE", "2"))

    async def run(self):
        """Main worker loop."""
        print("Worker started, waiting for jobs...")
        while True:
            try:
                # Block indefinitely until a job arrives
                job_id = await asyncio.to_thread(self.redis.pop_job)
                if job_id:
                    print("running job", job_id)
                    await self.process_job(job_id)
            except KeyboardInterrupt:
                print("Worker shutting down...")
                break
            except Exception as e:
                print(f"Worker error in main loop: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def process_job(self, job_id: int):
        """Process a single job with retry logic."""
        async with SessionLocal() as session:
            job_repo = JobRepository(session)
            job = await job_repo.get_by_id(job_id)
            if not job:
                print(f"Job {job_id} not found in database")
                return

            job_type = job["job_type"]
            payload = job["payload"]
            retry_count = job["retry_count"]

            print(f"Processing job {job_id} (type={job_type}, retry={retry_count})")

            # Update status to processing
            await job_repo.update_status(job_id, "processing")
            await session.commit()
            self.redis.publish_progress(job_id, "processing", f"Starting {job_type} job...")

            try:
                # Execute job based on type
                if job_type == "analysis":
                    result_id = await self.run_analysis_job(job_id, payload, session)
                elif job_type == "assets":
                    result_id = await self.run_assets_job(job_id, payload, session)
                elif job_type == "scrape":
                    result_id = await self.run_scrape_job(job_id, payload, session)
                else:
                    raise ValueError(f"Unknown job type: {job_type}")

                # Success
                await job_repo.update_status(job_id, "completed")
                await job_repo.update_result(job_id, result_id)
                self.redis.publish_progress(job_id, "completed", f"{job_type} job completed successfully")
                print(f"Job {job_id} completed successfully")
                await session.commit()

            except Exception as e:
                await session.rollback()
                error_msg = str(e)
                traceback.print_exc()
                
                # Check if we should retry
                retry_count = await job_repo.increment_retry(job_id)
                
                if retry_count < self.max_retries:
                    # Calculate backoff delay
                    backoff_delay = self.retry_backoff_base ** retry_count
                    print(f"Job {job_id} failed (attempt {retry_count}/{self.max_retries}), retrying in {backoff_delay}s...")
                    
                    self.redis.publish_progress(
                        job_id, 
                        "retrying", 
                        f"Job failed (attempt {retry_count}/{self.max_retries}), retrying in {backoff_delay}s..."
                    )
                    
                    # Sleep for backoff
                    await asyncio.sleep(backoff_delay)
                    
                    # Re-queue the job
                    self.redis.push_job(job_id)
                    await job_repo.update_status(job_id, "queued")
                    await session.commit()
                    
                else:
                    # Max retries exceeded, mark as failed
                    print(f"Job {job_id} failed after {retry_count} attempts")
                    await job_repo.update_status(job_id, "failed", error_message=error_msg)
                    self.redis.publish_progress(job_id, "failed", f"Job failed after {retry_count} attempts: {error_msg}")
                    await session.commit()

    async def run_analysis_job(self, job_id: int, payload: dict, session: AsyncSession) -> Optional[int]:
        """Run hackathon analysis job."""
        hackathon_id = payload.get("hackathon_id")
        user_id = payload.get("user_id")
        analysis_id = payload.get("analysis_id")

        if not hackathon_id:
            raise ValueError("Missing hackathon_id in payload")

        analysis_repo = AgentAnalysisRepository(session)
        rounds_repo = AgentRoundsRepository(session)
        hackathon_repo = HackathonRepository(session)
        problem_repo = ProblemRepository(session)

        # Ensure we have an analysis_id
        if not analysis_id:
            # Fallback for older jobs without analysis_id in payload
            hackathon = await hackathon_repo.get_by_id(hackathon_id)
            if not hackathon:
                raise ValueError("Hackathon not found")
            existing = await analysis_repo.get_by_hackathon_id(hackathon["id"], user_id=user_id)
            if existing:
                analysis_id = existing["id"]
                await analysis_repo.reset_analysis(analysis_id)
            else:
                analysis_id = await analysis_repo.create_pending(hackathon["id"], user_id=user_id)
                if not analysis_id:
                    raise ValueError("Failed to create pending analysis record")

        # Progress callback
        async def on_progress(message: str):
            # Update Redis Pub/Sub progress
            self.redis.publish_progress(job_id, "processing", message)
            # Update database status
            await analysis_repo.update_status(analysis_id, "RUNNING", message)
            await session.commit()

        hackathon = await hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon not found")

        internal_hackathon_id = hackathon["id"]

        await on_progress("Loading hackathon problem statements...")
        problems = await problem_repo.get_by_hackathon_id(internal_hackathon_id)

        # Build theme payload
        themes = []
        for problem in problems:
            themes.append({
                "title": problem.get("title"),
                "description": problem.get("description"),
                "type": problem.get("type")
            })

        if not themes:
            themes.append({
                "title": hackathon.get("title", "General Theme"),
                "description": hackathon.get("description", ""),
                "type": "general"
            })

        await on_progress("Initializing AI agents and debate pipeline...")
        llm = OllamaLLM()
        pipeline = DebatePipeline(
            llm=llm,
            debate_rounds=2,
            use_synthesizer=True
        )

        # Run pipeline with progress callback
        result = await pipeline.run(theme=themes, on_progress=on_progress)

        await on_progress("Saving analysis results...")
        
        # Save main analysis results by updating the existing pending row
        await analysis_repo.update_results(
            analysis_id,
            result,
            status="COMPLETED",
            status_message="Analysis completed successfully."
        )

        # Save rounds
        rounds = result.get("rounds", [])
        for idx, round_data in enumerate(rounds):
            await rounds_repo.create(
                analysis_id=analysis_id,
                round_number=idx + 1,
                data=round_data,
                user_id=user_id
            )

        return analysis_id

    async def run_assets_job(self, job_id: int, payload: dict, session: AsyncSession) -> Optional[int]:
        """Run assets generation job."""
        hackathon_id = payload.get("hackathon_id")
        user_id = payload.get("user_id")

        if not hackathon_id:
            raise ValueError("Missing hackathon_id in payload")

        async def on_progress(message: str):
            self.redis.publish_progress(job_id, "processing", message)

        hackathon_repo = HackathonRepository(session)
        analysis_repo = AgentAnalysisRepository(session)
        assets_repo = AssetsRepository(session)

        await on_progress("Loading analysis data...")
        hackathon = await hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon not found")

        internal_hackathon_id = hackathon["id"]
        analysis = await analysis_repo.get_by_hackathon_id(internal_hackathon_id, user_id=user_id)
        if not analysis:
            raise ValueError("Analysis not found")

        await on_progress("Generating technical proposal and pitch deck...")
        
        # Use AssetsService to generate
        assets_service = AssetsService(hackathon_repo, analysis_repo, assets_repo)
        await assets_service.generate_assets(hackathon_id, user_id=user_id)

        # Get the assets record
        assets = await assets_repo.get_by_hackathon_id(internal_hackathon_id, user_id=user_id)
        if assets:
            return assets["id"]
        
        return None

    async def run_scrape_job(self, job_id: int, payload: dict, session: AsyncSession) -> Optional[int]:
        """Run scraping job."""
        async def on_progress(message: str):
            self.redis.publish_progress(job_id, "processing", message)

        await on_progress("Starting hackathon scraping...")
        scraperHackathons()
        await on_progress("Scraping completed")
        
        # Return None as scraping doesn't create a specific result record
        return None


async def main():
    worker = Worker()
    try:
        await worker.run()
    finally:
        # Cleanup
        redis = get_redis_manager()
        redis.close()


if __name__ == "__main__":
    print("Starting worker...")
    asyncio.run(main())