import json
from typing import Optional, Dict, List

from db.database import Database


class JobRepository:
    def __init__(self, db: Database):
        self.db = db

    def create(self, job_type: str, payload: Dict) -> Optional[int]:
        """Create a new job with status='queued'."""
        query = """
            INSERT INTO jobs (job_type, payload, status)
            VALUES (%s, %s, 'queued')
            RETURNING id
        """
        values = (job_type, json.dumps(payload))
        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, values)
                row = cur.fetchone()
            conn.commit()

            if row:
                return row[0]
            return None

        except Exception as e:
            conn.rollback()
            print(f"DB error (JobRepository.create): {e}")
            return None

        finally:
            self.db.release_conn(conn)

    def get_by_id(self, job_id: int) -> Optional[Dict]:
        """Fetch job details by ID."""
        query = """
            SELECT *
            FROM jobs
            WHERE id = %s
        """
        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, (job_id,))
                row = cur.fetchone()
                if not row:
                    return None

                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))

        except Exception as e:
            print(f"DB error (JobRepository.get_by_id): {e}")
            return None

        finally:
            self.db.release_conn(conn)

    def update_status(self, job_id: int, status: str, error_message: Optional[str] = None):
        """Update job status and optionally error message."""
        if error_message:
            query = """
                UPDATE jobs
                SET status = %s,
                    error_message = %s
                WHERE id = %s
            """
            values = (status, error_message, job_id)
        else:
            query = """
                UPDATE jobs
                SET status = %s
                WHERE id = %s
            """
            values = (status, job_id)

        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, values)
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"DB error (JobRepository.update_status): {e}")
        finally:
            self.db.release_conn(conn)

    def update_result(self, job_id: int, result_id: Optional[int]):
        """Link job to result table (agent_analysis, assets, etc)."""
        query = """
            UPDATE jobs
            SET result_id = %s
            WHERE id = %s
        """
        values = (result_id, job_id)
        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, values)
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"DB error (JobRepository.update_result): {e}")
        finally:
            self.db.release_conn(conn)

    def increment_retry(self, job_id: int) -> int:
        """Increment retry count and return new count."""
        query = """
            UPDATE jobs
            SET retry_count = retry_count + 1
            WHERE id = %s
            RETURNING retry_count
        """
        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, (job_id,))
                row = cur.fetchone()
            conn.commit()
            if row:
                return row[0]
            return 0
        except Exception as e:
            conn.rollback()
            print(f"DB error (JobRepository.increment_retry): {e}")
            return 0
        finally:
            self.db.release_conn(conn)

    def get_queued_jobs(self, limit: int = 100) -> List[Dict]:
        """Fetch queued jobs for monitoring."""
        query = """
            SELECT *
            FROM jobs
            WHERE status = 'queued'
            ORDER BY created_at ASC
            LIMIT %s
        """
        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, (limit,))
                rows = cur.fetchall()
                if not rows:
                    return []

                columns = [desc[0] for desc in cur.description]
                return [dict(zip(columns, row)) for row in rows]

        except Exception as e:
            print(f"DB error (JobRepository.get_queued_jobs): {e}")
            return []

        finally:
            self.db.release_conn(conn)

    def get_jobs_by_status(self, status: str, limit: int = 100) -> List[Dict]:
        """Fetch jobs by status."""
        query = """
            SELECT *
            FROM jobs
            WHERE status = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, (status, limit))
                rows = cur.fetchall()
                if not rows:
                    return []

                columns = [desc[0] for desc in cur.description]
                return [dict(zip(columns, row)) for row in rows]

        except Exception as e:
            print(f"DB error (JobRepository.get_jobs_by_status): {e}")
            return []

        finally:
            self.db.release_conn(conn)

    def get_active_job_for_hackathon(self, hackathon_id: int, user_id: int = None) -> Optional[Dict]:
        """
        Find the latest active (queued or processing) analysis job for a hackathon.
        Used by GET /analysis so the frontend can reconnect SSE after a page reload.
        """
        if user_id is not None:
            query = """
                SELECT id, status
                FROM jobs
                WHERE job_type = 'analysis'
                  AND (payload->>'hackathon_id')::bigint = %s
                  AND (payload->>'user_id')::int = %s
                  AND status IN ('queued', 'processing')
                ORDER BY created_at DESC
                LIMIT 1
            """
            params = (hackathon_id, user_id)
        else:
            query = """
                SELECT id, status
                FROM jobs
                WHERE job_type = 'analysis'
                  AND (payload->>'hackathon_id')::bigint = %s
                  AND status IN ('queued', 'processing')
                ORDER BY created_at DESC
                LIMIT 1
            """
            params = (hackathon_id,)

        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                row = cur.fetchone()
                if not row:
                    return None
                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))
        except Exception as e:
            print(f"DB error (JobRepository.get_active_job_for_hackathon): {e}")
            return None
        finally:
            self.db.release_conn(conn)

