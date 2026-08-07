"""
test_schema_integrity.py
========================
Tests that the SQLAlchemy ORM models (via Base.metadata.create_all) produce
the expected schema structure:

  - All expected tables are created
  - All expected columns exist with the right types and nullability
  - All expected indexes exist
  - Foreign key constraints are wired up correctly

Uses the `full_schema_conn` fixture (function-scoped) which creates the schema
fresh per test to avoid cross-loop asyncpg errors.
"""
import pytest
import pytest_asyncio
from sqlalchemy import text


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_table_names(conn) -> list:
    result = await conn.execute(
        text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        )
    )
    return [row[0] for row in result.fetchall()]


async def get_columns(conn, table: str) -> dict:
    result = await conn.execute(
        text("""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table
            ORDER BY ordinal_position
        """),
        {"table": table},
    )
    return {
        row[0]: {
            "type": row[1],
            "nullable": row[2] == "YES",
            "default": row[3],
        }
        for row in result.fetchall()
    }


async def get_indexes(conn, table: str) -> list:
    result = await conn.execute(
        text("""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = :table
            ORDER BY indexname
        """),
        {"table": table},
    )
    return [row[0] for row in result.fetchall()]


async def get_foreign_keys(conn, table: str) -> list:
    result = await conn.execute(
        text("""
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints AS rc
                ON tc.constraint_name = rc.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON rc.unique_constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
              AND tc.table_name = :table
        """),
        {"table": table},
    )
    return [
        {"column": r[0], "ref_table": r[1], "ref_col": r[2]}
        for r in result.fetchall()
    ]


# ---------------------------------------------------------------------------
# Tests — Table Existence
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_all_expected_tables_exist(full_schema_conn):
    """Every table defined in the schema must be present after create_all."""
    expected = {
        "users",
        "hackathons",
        "jobs",
        "resources",
        "problem_statements",
        "chat_messages",
        "hackathon_assets",
        "agent_analysis",
        "agent_rounds",
    }
    actual = set(await get_table_names(full_schema_conn))
    missing = expected - actual
    assert not missing, f"Missing tables after create_all: {missing}"


# ---------------------------------------------------------------------------
# Tests — jobs table
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_jobs_table_columns(full_schema_conn):
    cols = await get_columns(full_schema_conn, "jobs")
    expected = {"id", "job_type", "payload", "status", "result_id",
                "error_message", "retry_count", "created_at", "updated_at"}
    missing = expected - set(cols.keys())
    assert not missing, f"jobs table missing columns: {missing}"


@pytest.mark.asyncio
async def test_jobs_required_columns_not_nullable(full_schema_conn):
    cols = await get_columns(full_schema_conn, "jobs")
    assert not cols["job_type"]["nullable"], "job_type should be NOT NULL"
    assert not cols["payload"]["nullable"], "payload should be NOT NULL"


@pytest.mark.asyncio
async def test_jobs_nullable_columns(full_schema_conn):
    cols = await get_columns(full_schema_conn, "jobs")
    assert cols["result_id"]["nullable"], "result_id should be nullable"
    assert cols["error_message"]["nullable"], "error_message should be nullable"


@pytest.mark.asyncio
async def test_jobs_status_has_default(full_schema_conn):
    cols = await get_columns(full_schema_conn, "jobs")
    assert cols["status"]["default"] is not None, "status should have a server default"


@pytest.mark.asyncio
async def test_jobs_has_primary_key_index(full_schema_conn):
    indexes = await get_indexes(full_schema_conn, "jobs")
    # The ORM model does not define named secondary indexes — only the pkey
    # This test verifies the primary key index exists as a minimum guarantee.
    assert any("pkey" in idx for idx in indexes), (
        f"Expected a primary key index on jobs, found: {indexes}"
    )


# ---------------------------------------------------------------------------
# Tests — hackathons table
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_hackathons_table_columns(full_schema_conn):
    cols = await get_columns(full_schema_conn, "hackathons")
    expected = {
        "id", "title", "description", "url", "start_date",
        "deadline", "created_at", "is_paid", "mode", "prizes",
        "team_size", "college_name"
    }
    missing = expected - set(cols.keys())
    assert not missing, f"hackathons missing columns: {missing}"


@pytest.mark.asyncio
async def test_hackathons_url_unique(full_schema_conn):
    """url column must have a unique constraint."""
    result = await full_schema_conn.execute(
        text("""
            SELECT COUNT(*)
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'UNIQUE'
              AND tc.table_schema = 'public'
              AND tc.table_name = 'hackathons'
              AND kcu.column_name = 'url'
        """)
    )
    count = result.scalar()
    assert count >= 1, "hackathons.url should have a UNIQUE constraint"


# ---------------------------------------------------------------------------
# Tests — users table
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_users_table_columns(full_schema_conn):
    cols = await get_columns(full_schema_conn, "users")
    for col in ("id", "email", "cognito_sub"):
        assert col in cols, f"users table is missing column: {col}"


@pytest.mark.asyncio
async def test_users_email_not_nullable(full_schema_conn):
    cols = await get_columns(full_schema_conn, "users")
    assert not cols["email"]["nullable"], "users.email should be NOT NULL"


# ---------------------------------------------------------------------------
# Tests — Foreign keys
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_agent_analysis_foreign_keys(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "agent_analysis")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "hackathons" in ref_tables, "agent_analysis must FK to hackathons"
    assert "users" in ref_tables, "agent_analysis must FK to users"


@pytest.mark.asyncio
async def test_agent_rounds_foreign_key_to_analysis(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "agent_rounds")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "agent_analysis" in ref_tables, "agent_rounds must FK to agent_analysis"


@pytest.mark.asyncio
async def test_resources_fk_to_hackathons(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "resources")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "hackathons" in ref_tables


@pytest.mark.asyncio
async def test_problem_statements_fk_to_hackathons(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "problem_statements")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "hackathons" in ref_tables


@pytest.mark.asyncio
async def test_chat_messages_fk_to_hackathons(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "chat_messages")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "hackathons" in ref_tables


@pytest.mark.asyncio
async def test_hackathon_assets_fk_to_hackathons_and_users(full_schema_conn):
    fks = await get_foreign_keys(full_schema_conn, "hackathon_assets")
    ref_tables = {fk["ref_table"] for fk in fks}
    assert "hackathons" in ref_tables
    assert "users" in ref_tables
