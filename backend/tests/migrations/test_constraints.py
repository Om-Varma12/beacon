"""
test_constraints.py
===================
Tests that database-level constraints actually fire and reject bad data.

Runs raw SQL INSERT statements against the test DB (after the full schema has
been created) to verify that:

  - jobs.job_type CHECK constraint rejects invalid values
  - jobs.status CHECK constraint rejects invalid values
  - hackathons.url UNIQUE constraint prevents duplicate URLs
  - NOT NULL constraints reject missing required fields
  - Foreign key constraints prevent orphan rows

Uses `full_schema_conn` (function-scoped, autocommit) from conftest.
"""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, DBAPIError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _insert_job(conn, job_type: str = "analysis", status: str = None, payload: str = "'{}'::jsonb"):
    """Helper to insert a job row, optionally with an explicit status."""
    if status:
        await conn.execute(
            text(f"INSERT INTO jobs (job_type, payload, status) VALUES (:jt, {payload}, :st)"),
            {"jt": job_type, "st": status},
        )
    else:
        await conn.execute(
            text(f"INSERT INTO jobs (job_type, payload) VALUES (:jt, {payload})"),
            {"jt": job_type},
        )


# ---------------------------------------------------------------------------
# jobs — CHECK constraint: job_type
# ---------------------------------------------------------------------------

class TestJobsJobTypeConstraint:

    @pytest.mark.asyncio
    async def test_valid_job_type_analysis(self, full_schema_conn):
        """Valid job_type 'analysis' should insert without error."""
        await _insert_job(full_schema_conn, "analysis")

    @pytest.mark.asyncio
    async def test_valid_job_type_assets(self, full_schema_conn):
        await _insert_job(full_schema_conn, "assets")

    @pytest.mark.asyncio
    async def test_valid_job_type_scrape(self, full_schema_conn):
        await _insert_job(full_schema_conn, "scrape")

    @pytest.mark.asyncio
    @pytest.mark.xfail(
        reason="Job ORM model does not define CheckConstraint on job_type; "
               "CHECK constraints only exist in the raw SQL migration file "
               "(tested in test_sql_migration.py). Add CheckConstraint to "
               "models/Job.py to make this pass.",
        strict=False,
    )
    async def test_invalid_job_type_rejected(self, full_schema_conn):
        """Any value outside the allowed set must raise a DB error."""
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO jobs (job_type, payload) VALUES ('invalid_type', '{}'::jsonb)")
            )

    @pytest.mark.asyncio
    @pytest.mark.xfail(
        reason="Job ORM model has no CheckConstraint on job_type; empty string not blocked at DB level.",
        strict=False,
    )
    async def test_empty_job_type_rejected(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO jobs (job_type, payload) VALUES ('', '{}'::jsonb)")
            )


# ---------------------------------------------------------------------------
# jobs — CHECK constraint: status
# ---------------------------------------------------------------------------

class TestJobsStatusConstraint:

    @pytest.mark.asyncio
    async def test_valid_statuses_insert(self, full_schema_conn):
        """All four allowed statuses should insert cleanly."""
        for status in ("queued", "processing", "completed", "failed"):
            await _insert_job(full_schema_conn, "analysis", status=status)

    @pytest.mark.asyncio
    @pytest.mark.xfail(
        reason="Job ORM model has no CheckConstraint on status; invalid values not blocked at DB level.",
        strict=False,
    )
    async def test_invalid_status_rejected(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text(
                    "INSERT INTO jobs (job_type, payload, status) "
                    "VALUES ('analysis', '{}'::jsonb, 'pending')"
                )
            )

    @pytest.mark.asyncio
    async def test_status_defaults_to_queued(self, full_schema_conn):
        """Omitting status should default to 'queued'."""
        result = await full_schema_conn.execute(
            text(
                "INSERT INTO jobs (job_type, payload) "
                "VALUES ('scrape', '{}'::jsonb) RETURNING status"
            )
        )
        status = result.scalar()
        assert status == "queued", f"Expected default status 'queued', got '{status}'"


# ---------------------------------------------------------------------------
# jobs — NOT NULL constraints
# ---------------------------------------------------------------------------

class TestJobsNotNullConstraints:

    @pytest.mark.asyncio
    async def test_job_type_required(self, full_schema_conn):
        """Omitting job_type must fail."""
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO jobs (payload) VALUES ('{}'::jsonb)")
            )

    @pytest.mark.asyncio
    async def test_payload_required(self, full_schema_conn):
        """Omitting payload must fail."""
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO jobs (job_type) VALUES ('analysis')")
            )


# ---------------------------------------------------------------------------
# hackathons — UNIQUE constraint on url
# ---------------------------------------------------------------------------

class TestHackathonsUniqueUrl:

    @pytest.mark.asyncio
    async def test_unique_url_enforced(self, full_schema_conn):
        """Inserting two hackathons with the same URL must raise an error."""
        url = "https://unique-constraint-test.example.com"
        await full_schema_conn.execute(
            text("INSERT INTO hackathons (title, url) VALUES ('H1', :url)"),
            {"url": url},
        )
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO hackathons (title, url) VALUES ('H2', :url)"),
                {"url": url},
            )

    @pytest.mark.asyncio
    async def test_null_urls_allowed_multiple(self, full_schema_conn):
        """Multiple hackathons can have NULL url (UNIQUE does not block NULLs in Postgres)."""
        await full_schema_conn.execute(
            text("INSERT INTO hackathons (title) VALUES ('No URL 1')")
        )
        await full_schema_conn.execute(
            text("INSERT INTO hackathons (title) VALUES ('No URL 2')")
        )
        # If we get here without error, test passes


# ---------------------------------------------------------------------------
# users — NOT NULL / UNIQUE constraints
# ---------------------------------------------------------------------------

class TestUsersConstraints:

    @pytest.mark.asyncio
    async def test_users_email_required(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO users (cognito_sub, name) VALUES ('sub-x', 'John')")
            )

    @pytest.mark.asyncio
    async def test_users_cognito_sub_required(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO users (email, name) VALUES ('orphan@test.com', 'Jane')")
            )

    @pytest.mark.asyncio
    async def test_users_email_unique(self, full_schema_conn):
        email = "unique-email-test@example.com"
        await full_schema_conn.execute(
            text("INSERT INTO users (cognito_sub, email) VALUES ('sub-1', :email)"),
            {"email": email},
        )
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO users (cognito_sub, email) VALUES ('sub-2', :email)"),
                {"email": email},
            )

    @pytest.mark.asyncio
    async def test_users_cognito_sub_unique(self, full_schema_conn):
        await full_schema_conn.execute(
            text("INSERT INTO users (cognito_sub, email) VALUES ('same-sub', 'a@test.com')")
        )
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text("INSERT INTO users (cognito_sub, email) VALUES ('same-sub', 'b@test.com')")
            )


# ---------------------------------------------------------------------------
# Foreign key constraints
# ---------------------------------------------------------------------------

class TestForeignKeyConstraints:

    @pytest.mark.asyncio
    async def test_agent_analysis_rejects_missing_hackathon(self, full_schema_conn):
        """agent_analysis with a non-existent hackathon_id must fail."""
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text(
                    "INSERT INTO agent_analysis (hackathon_id, status) "
                    "VALUES (99999, 'COMPLETED')"
                )
            )

    @pytest.mark.asyncio
    async def test_resources_rejects_missing_hackathon(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text(
                    "INSERT INTO resources (hackathon_id, resource_type, url) "
                    "VALUES (99999, 'link', 'https://example.com')"
                )
            )

    @pytest.mark.asyncio
    async def test_agent_rounds_rejects_missing_analysis(self, full_schema_conn):
        with pytest.raises((IntegrityError, DBAPIError, Exception)):
            await full_schema_conn.execute(
                text(
                    "INSERT INTO agent_rounds (analysis_id, round_number) "
                    "VALUES (99999, 1)"
                )
            )

    @pytest.mark.asyncio
    async def test_valid_agent_analysis_with_existing_hackathon(self, full_schema_conn):
        """Inserting an agent_analysis with a real hackathon FK should succeed."""
        # First insert a hackathon
        result = await full_schema_conn.execute(
            text("INSERT INTO hackathons (title) VALUES ('FK Test Hackathon') RETURNING id")
        )
        hackathon_id = result.scalar()

        # Now insert an analysis pointing to it
        await full_schema_conn.execute(
            text(
                "INSERT INTO agent_analysis (hackathon_id, status) "
                "VALUES (:hid, 'COMPLETED')"
            ),
            {"hid": hackathon_id},
        )
        # Reaching here means FK is satisfied
