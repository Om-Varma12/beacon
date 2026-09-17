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
from db.HackathonEmbeddingRepository import HackathonEmbeddingRepository
from db.UserPreferenceClusterRepository import UserPreferenceClusterRepository

from scraper.main_scraper import scraperHackathons
from services.AssetsService import AssetsService

from utils.redis_manager import get_redis_manager
from agents.hybrid_llm import HybridLLM
from orchestrator.pipeline import DebatePipeline


class Worker:
    def __init__(self):
        self.redis = get_redis_manager()
        
        # Configuration
        self.max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))
        self.retry_backoff_base = int(os.getenv("WORKER_RETRY_BACKOFF_BASE", "2"))
        self.max_concurrent = int(os.getenv("WORKER_MAX_CONCURRENT_JOBS", "5"))
        self.semaphore = asyncio.Semaphore(self.max_concurrent)

    async def run(self):
        """Main worker loop."""
        print(f"Worker started (max_concurrent={self.max_concurrent}), waiting for jobs...")
        while True:
            try:
                # Block indefinitely until a job arrives
                job_id_str = await asyncio.to_thread(self.redis.pop_job)
                if job_id_str:
                    job_id = int(job_id_str)
                    print(f"Queuing job {job_id} ({self.max_concurrent - self.semaphore._value}/{self.max_concurrent} slots in use)")
                    # Acquire a slot before spawning — blocks here if all slots are full
                    await self.semaphore.acquire()
                    # Fire-and-forget: the main loop is free to pop the next job immediately
                    asyncio.create_task(self._process_with_semaphore(job_id))
            except KeyboardInterrupt:
                print("Worker shutting down...")
                break
            except Exception as e:
                print(f"Worker error in main loop: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def _process_with_semaphore(self, job_id: int):
        """Runs process_job and releases the semaphore slot when done."""
        try:
            await self.process_job(job_id)
        finally:
            self.semaphore.release()

    async def process_job(self, job_id: int, session: AsyncSession | None = None):
        """Process a single job with retry logic."""
        close_session = False
        
        # Use provided session or create new one
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
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
            await self.redis.publish_progress(job_id, "processing", f"Starting {job_type} job...")

            try:
                # Execute job based on type
                if job_type == "analysis":
                    result_id = await self.run_analysis_job(job_id, payload, session)
                elif job_type == "assets":
                    result_id = await self.run_assets_job(job_id, payload, session)
                elif job_type == "scrape":
                    result_id = await self.run_scrape_job(job_id, payload, session)
                elif job_type == "update_user_cluster":
                    result_id = await self.run_update_user_cluster_job(job_id, payload, session)
                else:
                    raise ValueError(f"Unknown job type: {job_type}")

                # Success
                await job_repo.update_status(job_id, "completed")
                await job_repo.update_result(job_id, result_id)
                await self.redis.publish_progress(job_id, "completed", f"{job_type} job completed successfully")
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
                    
                    await self.redis.publish_progress(
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
                    await self.redis.publish_progress(job_id, "failed", f"Job failed after {retry_count} attempts: {error_msg}")
                    await session.commit()
        
        finally:
            if close_session:
                await session.close()

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
            await self.redis.publish_progress(job_id, "processing", message)
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
        llm = HybridLLM()
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
            await self.redis.publish_progress(job_id, "processing", message)

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
            await self.redis.publish_progress(job_id, "processing", message)

        await scraperHackathons()
        await on_progress("Scraping completed")

        # Return None as scraping doesn't create a specific result record
        return None

    async def run_update_user_cluster_job(self, job_id: int, payload: dict, session: AsyncSession) -> Optional[int]:
        """
        Update user's preference clusters based on hackathon interaction.
        Implements the merge/spawn logic from user-cluster.md.
        """
        user_id = payload.get("user_id")
        hackathon_id = payload.get("hackathon_id")
        weight = payload.get("weight")

        if not user_id or not hackathon_id or weight is None:
            raise ValueError("Missing user_id, hackathon_id or weight in payload")

        # Repositories
        embedding_repo = HackathonEmbeddingRepository(session)
        cluster_repo = UserPreferenceClusterRepository(session)

        # 1. Fetch hackathon's embedding
        hackathon_data = await embedding_repo.get_by_hackathon_id(hackathon_id)
        if not hackathon_data:
            # In a real scenario, we might trigger an 'embed_hackathon' job here
            print(f"No embedding found for hackathon {hackathon_id}. Skipping cluster update.")
            return None

        hackathon_embedding = hackathon_data["embedding"]

        # 2. Fetch user's existing clusters
        clusters = await cluster_repo.get_by_user_id(user_id)

        if not clusters:
            # Case: No clusters exist -> create one as is
            print(f"No existing clusters for user {user_id}. Creating first cluster.")
            cluster_id = await cluster_repo.create(
                user_id=user_id,
                embedding=hackathon_embedding,
                weight_sum=weight
            )
            return cluster_id

        # 3. Compute similarity against each cluster
        # Formula: cosine_sim = dot(A, B) / (||A|| * ||B||)
        # Since Jina embeddings are normalized, dot product is cosine similarity.
        def cosine_similarity(v1, v2):
            return sum(a * b for a, b in zip(v1, v2))

        best_similarity = -1.0
        best_cluster = None

        for cluster in clusters:
            sim = cosine_similarity(hackathon_embedding, cluster["embedding"])
            if sim > best_similarity:
                best_similarity = sim
                best_cluster = cluster

        # 4. Merge/Spawn Logic
        # similarity >= 0.5 -> merge (weighted running average)
        if best_similarity >= 0.5:
            print(f"Merging into existing cluster {best_cluster['id']} (sim={best_similarity:.2f})")

            # Weighted running average:
            # NewVec = ((OldVec * OldWeight) + (HackVec * NewWeight)) / (OldWeight + NewWeight)
            old_vec = best_cluster["embedding"]
            old_weight = best_cluster["weight_sum"]

            new_weight_sum = old_weight + weight
            new_embedding = [
                ((v * old_weight) + (h * weight)) / new_weight_sum
                for v, h in zip(old_vec, hackathon_embedding)
            ]

            await cluster_repo.update(best_cluster["id"], new_embedding, new_weight_sum)
            return best_cluster["id"]

        # similarity < 0.5 and < 3 rows -> spawn new cluster
        elif len(clusters) < 3:
            print(f"Spawning new cluster for user {user_id} (sim={best_similarity:.2f} < 0.5)")
            cluster_id = await cluster_repo.create(
                user_id=user_id,
                embedding=hackathon_embedding,
                weight_sum=weight
            )
            return cluster_id

        # similarity < 0.5 and at cap -> force-merge into closest anyway
        else:
            print(f"Force-merging into closest cluster {best_cluster['id']} (at cap of 3 clusters)")
            old_vec = best_cluster["embedding"]
            old_weight = best_cluster["weight_sum"]

            new_weight_sum = old_weight + weight
            new_embedding = [
                ((v * old_weight) + (h * weight)) / new_weight_sum
                for v, h in zip(old_vec, hackathon_embedding)
            ]

            await cluster_repo.update(best_cluster["id"], new_embedding, new_weight_sum)
            return best_cluster["id"]


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