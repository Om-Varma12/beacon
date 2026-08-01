from typing import Dict, List, Optional

from sqlalchemy import cast, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import BigInteger, Integer

from models.Job import Job


class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def create(
        self,
        job_type: str,
        payload: Dict,
    ) -> Optional[int]:
        job = Job(
            job_type=job_type,
            payload=payload,
            status="queued",
        )

        self.session.add(job)

        await self.session.flush()

        return job.id


    async def get_by_id(
        self,
        job_id: int,
    ) -> Optional[Dict]:
        stmt = (
            select(Job)
            .where(Job.id == job_id)
        )

        result = await self.session.execute(stmt)

        job = result.scalar_one_or_none()

        if job is None:
            return None

        return {
            "id": job.id,
            "job_type": job.job_type,
            "payload": job.payload,
            "status": job.status,
            "result_id": job.result_id,
            "retry_count": job.retry_count,
            "error_message": job.error_message,
            "created_at": job.created_at,
        }


    async def update_status(
        self,
        job_id: int,
        status: str,
        error_message: Optional[str] = None,
    ):
        stmt = (
            select(Job)
            .where(Job.id == job_id)
        )

        result = await self.session.execute(stmt)

        job = result.scalar_one_or_none()

        if job is None:
            return

        job.status = status

        if error_message is not None:
            job.error_message = error_message


    async def update_result(
        self,
        job_id: int,
        result_id: Optional[int],
    ):
        stmt = (
            select(Job)
            .where(Job.id == job_id)
        )

        result = await self.session.execute(stmt)

        job = result.scalar_one_or_none()

        if job is None:
            return

        job.result_id = result_id


    async def increment_retry(
        self,
        job_id: int,
    ) -> int:
        stmt = (
            select(Job)
            .where(Job.id == job_id)
        )

        result = await self.session.execute(stmt)

        job = result.scalar_one_or_none()

        if job is None:
            return 0

        job.retry_count += 1

        await self.session.flush()

        return job.retry_count


    async def get_queued_jobs(
        self,
        limit: int = 100,
    ) -> List[Dict]:
        stmt = (
            select(Job)
            .where(Job.status == "queued")
            .order_by(Job.created_at.asc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)

        jobs = result.scalars().all()

        return [
            {
                "id": j.id,
                "job_type": j.job_type,
                "payload": j.payload,
                "status": j.status,
                "result_id": j.result_id,
                "retry_count": j.retry_count,
                "error_message": j.error_message,
                "created_at": j.created_at,
            }
            for j in jobs
        ]


    async def get_jobs_by_status(
        self,
        status: str,
        limit: int = 100,
    ) -> List[Dict]:
        stmt = (
            select(Job)
            .where(Job.status == status)
            .order_by(Job.created_at.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)

        jobs = result.scalars().all()

        return [
            {
                "id": j.id,
                "job_type": j.job_type,
                "payload": j.payload,
                "status": j.status,
                "result_id": j.result_id,
                "retry_count": j.retry_count,
                "error_message": j.error_message,
                "created_at": j.created_at,
            }
            for j in jobs
        ]


    async def get_active_job_for_hackathon(
        self,
        hackathon_id: int,
        user_id: int = None,
    ) -> Optional[Dict]:
        stmt = (
            select(Job.id, Job.status)
            .where(Job.job_type == "analysis")
            .where(
                cast(
                    Job.payload["hackathon_id"].astext,
                    BigInteger,
                ) == hackathon_id
            )
            .where(
                Job.status.in_(["queued", "processing"])
            )
            .order_by(Job.created_at.desc())
            .limit(1)
        )

        if user_id is not None:
            stmt = stmt.where(
                cast(
                    Job.payload["user_id"].astext,
                    Integer,
                ) == user_id
            )

        result = await self.session.execute(stmt)

        row = result.first()

        if row is None:
            return None

        return {
            "id": row.id,
            "status": row.status,
        }