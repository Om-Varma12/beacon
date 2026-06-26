import asyncio
import os
import time
import traceback
from typing import Optional

from db.database import Database
from db.JobRepository import JobRepository
from db.HackathonRepository import HackathonRepository
from db.ProblemRepository import ProblemRepository
from db.AgentAnalysisRepository import AgentAnalysisRepository
from db.AgentRoundsRepository import AgentRoundsRepository
from db.AssetsRepository import AssetsRepository
from db.UserRepository import UserRepository

from services.AnalysisService import AnalysisService
from services.AssetsService import AssetsService

from scraper.main_scraper import scraperHackathons

from utils.redis_manager import get_redis_manager
from agents.ollama_llm import OllamaLLM
from orchestrator.pipeline import DebatePipeline


class Worker:
    def __init__(self):
        self.db = Database()
        self.job_repo = JobRepository(self.db)
        self.redis = get_redis_manager()
        
        # Configuration
        self.max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))
        self.retry_backoff_base = int(os.getenv("WORKER_RETRY_BACKOFF_BASE", "2"))
        self.queue_timeout = int(os.getenv("WORKER_QUEUE_TIMEOUT", "5"))

    async def run(self):
        """Main worker loop."""
        print("Worker started, waiting for jobs...")
        while True:
            try:
                job_id = self.redis.pop_job(timeout=self.queue_timeout)
                if job_id:
                    print("running job", job_id)
                    await self.process_job(job_id)
                else:
                    # No job, brief sleep before next check
                    await asyncio.sleep(0.1)
            except KeyboardInterrupt:
                print("Worker shutting down...")
                break
            except Exception as e:
                print(f"Worker error in main loop: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def process_job(self, job_id: int):
        """Process a single job with retry logic."""
        job = self.job_repo.get_by_id(job_id)
        if not job:
            print(f"Job {job_id} not found in database")
            return

        job_type = job["job_type"]
        payload = job["payload"]
        retry_count = job["retry_count"]

        print(f"Processing job {job_id} (type={job_type}, retry={retry_count})")

        # Update status to processing
        self.job_repo.update_status(job_id, "processing")
        self.redis.publish_progress(job_id, "processing", f"Starting {job_type} job...")

        try:
            # Execute job based on type
            if job_type == "analysis":
                result_id = await self.run_analysis_job(job_id, payload)
            elif job_type == "assets":
                result_id = await self.run_assets_job(job_id, payload)
            elif job_type == "scrape":
                result_id = await self.run_scrape_job(job_id, payload)
            else:
                raise ValueError(f"Unknown job type: {job_type}")

            # Success
            self.job_repo.update_status(job_id, "completed")
            self.job_repo.update_result(job_id, result_id)
            self.redis.publish_progress(job_id, "completed", f"{job_type} job completed successfully")
            print(f"Job {job_id} completed successfully")

        except Exception as e:
            error_msg = str(e)
            traceback.print_exc()
            
            # Check if we should retry
            retry_count = self.job_repo.increment_retry(job_id)
            
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
                self.job_repo.update_status(job_id, "queued")
                
            else:
                # Max retries exceeded, mark as failed
                print(f"Job {job_id} failed after {retry_count} attempts")
                self.job_repo.update_status(job_id, "completed", error_message=error_msg)
                self.redis.publish_progress(job_id, "failed", f"Job failed after {retry_count} attempts: {error_msg}")

    async def run_analysis_job(self, job_id: int, payload: dict) -> Optional[int]:
        """Run hackathon analysis job."""
        hackathon_id = payload.get("hackathon_id")
        user_id = payload.get("user_id")

        if not hackathon_id:
            raise ValueError("Missing hackathon_id in payload")

        # Progress callback
        async def on_progress(message: str):
            self.redis.publish_progress(job_id, "processing", message)

        # Fetch hackathon
        hackathon_repo = HackathonRepository(self.db)
        problem_repo = ProblemRepository(self.db)
        analysis_repo = AgentAnalysisRepository(self.db)
        rounds_repo = AgentRoundsRepository(self.db)

        hackathon = hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon not found")

        internal_hackathon_id = hackathon["id"]

        await on_progress("Loading hackathon problem statements...")
        problems = problem_repo.get_by_hackathon_id(internal_hackathon_id)

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
        # Create analysis record
        analysis_id = analysis_repo.create(
            internal_hackathon_id,
            result,
            user_id=user_id
        )

        if not analysis_id:
            raise ValueError("Failed to create analysis record")

        # Save rounds
        rounds = result.get("rounds", [])
        for idx, round_data in enumerate(rounds):
            rounds_repo.create(
                analysis_id=analysis_id,
                round_number=idx + 1,
                data=round_data,
                user_id=user_id
            )

        return analysis_id

    async def run_assets_job(self, job_id: int, payload: dict) -> Optional[int]:
        """Run assets generation job."""
        hackathon_id = payload.get("hackathon_id")
        user_id = payload.get("user_id")

        if not hackathon_id:
            raise ValueError("Missing hackathon_id in payload")

        async def on_progress(message: str):
            self.redis.publish_progress(job_id, "processing", message)

        hackathon_repo = HackathonRepository(self.db)
        analysis_repo = AgentAnalysisRepository(self.db)
        assets_repo = AssetsRepository(self.db)

        await on_progress("Loading analysis data...")
        hackathon = hackathon_repo.get_by_id(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon not found")

        internal_hackathon_id = hackathon["id"]
        analysis = analysis_repo.get_by_hackathon_id(internal_hackathon_id, user_id=user_id)
        if not analysis:
            raise ValueError("Analysis not found")

        await on_progress("Generating technical proposal and pitch deck...")
        
        # Use AssetsService to generate
        assets_service = AssetsService(hackathon_repo, analysis_repo, assets_repo)
        await assets_service.generate_assets(hackathon_id, user_id=user_id)

        # Get the assets record
        assets = assets_repo.get_by_analysis_id(analysis["id"])
        if assets:
            return assets["id"]
        
        return None

    async def run_scrape_job(self, job_id: int, payload: dict) -> Optional[int]:
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
    asyncio.run(main())
