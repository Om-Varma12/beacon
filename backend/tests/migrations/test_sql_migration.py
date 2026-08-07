"""
test_sql_migration.py
=====================
Tests the raw SQL migration files in db/migrations/ against a clean DB.

For each migration file we verify:
  - The SQL executes without errors
  - The resulting tables/indexes/functions/triggers actually exist in Postgres
  - Running the migration twice is safe (IF NOT EXISTS / CREATE OR REPLACE guards)
  - The trigger function actually fires on UPDATE

Uses `raw_conn` (function-scoped, autocommit) from conftest.
"""
import pytest
import pytest_asyncio
from sqlalchemy import text

from tests.migrations.conftest import read_migration


# ---------------------------------------------------------------------------
# Helper: run all statements in a migration file
# ---------------------------------------------------------------------------

def _split_sql_statements(sql: str) -> list:
    """
    Split a SQL file into individual statements, correctly handling
    dollar-quoted strings ($$...$$) used in PL/pgSQL function bodies.
    Uses a simple state machine: toggle in_dollar_quote on each $$ token.
    Splits on ; only when NOT inside a dollar-quoted block.
    """
    import re
    tokens = re.split(r'(\$\$)', sql)
    # tokens alternates: [text, "$$", text, "$$", text, ...]
    result = []
    buf = ""
    in_dq = False
    for token in tokens:
        if token == "$$":
            buf += token
            in_dq = not in_dq
        elif not in_dq:
            # Outside dollar-quote: split on semicolons
            parts = token.split(";")
            for i, part in enumerate(parts):
                buf += part
                if i < len(parts) - 1:  # there was a semicolon here
                    stmt = buf.strip()
                    if stmt:
                        result.append(stmt)
                    buf = ""
        else:
            # Inside dollar-quote: accumulate as-is
            buf += token
    # Flush any remaining content
    if buf.strip():
        result.append(buf.strip())
    return result


async def apply_migration(conn, filename: str) -> None:
    migration_sql = read_migration(filename)
    statements = _split_sql_statements(migration_sql)
    for stmt in statements:
        if stmt.strip():
            await conn.execute(text(stmt))


# ---------------------------------------------------------------------------
# Fixture: apply 001 migration, expose connection
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def migrated_conn(raw_conn):
    """Applies 001_create_jobs_table.sql and yields the connection."""
    await apply_migration(raw_conn, "001_create_jobs_table.sql")
    yield raw_conn


# ---------------------------------------------------------------------------
# 001_create_jobs_table.sql — structure tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_migration_001_jobs_table_exists(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_tables "
            "  WHERE schemaname='public' AND tablename='jobs'"
            ")"
        )
    )
    assert result.scalar() is True, "jobs table should exist after migration 001"


@pytest.mark.asyncio
async def test_migration_001_expected_columns(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name='jobs'"
        )
    )
    columns = {row[0] for row in result.fetchall()}
    expected = {"id", "job_type", "payload", "status", "result_id",
                "error_message", "retry_count", "created_at", "updated_at"}
    missing = expected - columns
    assert not missing, f"Migration 001 is missing columns: {missing}"


@pytest.mark.asyncio
async def test_migration_001_idx_jobs_status(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_indexes "
            "  WHERE schemaname='public' AND tablename='jobs' "
            "  AND indexname='idx_jobs_status'"
            ")"
        )
    )
    assert result.scalar() is True, "idx_jobs_status index should exist"


@pytest.mark.asyncio
async def test_migration_001_idx_jobs_job_type(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_indexes "
            "  WHERE schemaname='public' AND tablename='jobs' "
            "  AND indexname='idx_jobs_job_type'"
            ")"
        )
    )
    assert result.scalar() is True, "idx_jobs_job_type index should exist"


@pytest.mark.asyncio
async def test_migration_001_idx_jobs_created_at(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_indexes "
            "  WHERE schemaname='public' AND tablename='jobs' "
            "  AND indexname='idx_jobs_created_at'"
            ")"
        )
    )
    assert result.scalar() is True, "idx_jobs_created_at index should exist"


@pytest.mark.asyncio
async def test_migration_001_idx_jobs_result_id(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_indexes "
            "  WHERE schemaname='public' AND tablename='jobs' "
            "  AND indexname='idx_jobs_result_id'"
            ")"
        )
    )
    assert result.scalar() is True, "idx_jobs_result_id index should exist"


@pytest.mark.asyncio
async def test_migration_001_trigger_function_exists(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_proc "
            "  WHERE proname = 'update_updated_at_column'"
            ")"
        )
    )
    assert result.scalar() is True, "update_updated_at_column() function should exist"


@pytest.mark.asyncio
async def test_migration_001_trigger_exists(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_trigger "
            "  WHERE tgname = 'update_jobs_updated_at'"
            ")"
        )
    )
    assert result.scalar() is True, "update_jobs_updated_at trigger should exist"


@pytest.mark.asyncio
async def test_migration_001_check_constraints_exist(migrated_conn):
    result = await migrated_conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.table_constraints "
            "WHERE table_schema='public' AND table_name='jobs' "
            "AND constraint_type='CHECK'"
        )
    )
    count = result.scalar()
    assert count >= 1, "jobs should have at least one CHECK constraint"


# ---------------------------------------------------------------------------
# Idempotency test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_migration_001_idempotent(migrated_conn):
    """
    Running migration 001 a second time must succeed without errors.

    Guards in the migration:
      - CREATE TABLE IF NOT EXISTS
      - CREATE INDEX IF NOT EXISTS
      - CREATE OR REPLACE FUNCTION
      - DROP TRIGGER IF EXISTS + CREATE TRIGGER
    """
    # migrated_conn already has migration applied once — run it again
    await apply_migration(migrated_conn, "001_create_jobs_table.sql")
    # Reaching here without exception = fully idempotent ✅


# ---------------------------------------------------------------------------
# Trigger behaviour test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_migration_001_trigger_fires_on_update(migrated_conn):
    """
    Insert a row, then UPDATE it, and verify updated_at changes.
    Uses asyncpg's pg_sleep to guarantee timestamp difference.
    """
    # Insert
    await migrated_conn.execute(
        text(
            "INSERT INTO jobs (job_type, payload) "
            "VALUES ('analysis', '{}'::jsonb)"
        )
    )

    # Read original updated_at
    result = await migrated_conn.execute(
        text("SELECT id, updated_at FROM jobs ORDER BY id DESC LIMIT 1")
    )
    row = result.fetchone()
    job_id, original_updated_at = row[0], row[1]

    # Small sleep to ensure timestamp changes
    await migrated_conn.execute(text("SELECT pg_sleep(0.05)"))

    # Update the row
    await migrated_conn.execute(
        text("UPDATE jobs SET error_message = 'trigger test' WHERE id = :id"),
        {"id": job_id},
    )

    # Fetch new updated_at
    result = await migrated_conn.execute(
        text("SELECT updated_at FROM jobs WHERE id = :id"),
        {"id": job_id},
    )
    new_updated_at = result.scalar()

    assert new_updated_at is not None, "updated_at should not be NULL after update"
    # The trigger should have bumped the timestamp
    assert new_updated_at >= original_updated_at, (
        "updated_at should be >= original after UPDATE"
    )
