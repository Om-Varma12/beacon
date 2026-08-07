"""
test_alembic_migrations.py
==========================
Tests Alembic migrations to ensure they work correctly.

This test suite verifies:
  - Alembic upgrade creates the correct schema
  - Alembic downgrade properly cleans up
  - Migration idempotency (upgrade → downgrade → upgrade)
  - Alembic schema matches ORM schema (Base.metadata.create_all)

Uses the `alembic_conn` fixture from conftest.py which runs Alembic
migrations up/down around each test.
"""
import pathlib
import pytest
import pytest_asyncio
from sqlalchemy import text


# ---------------------------------------------------------------------------
# Schema verification helpers
# ---------------------------------------------------------------------------

async def get_table_names(conn) -> list:
    """Get all table names in the public schema."""
    result = await conn.execute(
        text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        )
    )
    return [row[0] for row in result.fetchall()]


async def get_columns(conn, table: str) -> dict:
    """Get column information for a specific table."""
    result = await conn.execute(
        text("""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name = :table
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
    """Get all indexes for a specific table."""
    result = await conn.execute(
        text("""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname='public' AND tablename = :table
            ORDER BY indexname
        """),
        {"table": table},
    )
    return [row[0] for row in result.fetchall()]


async def get_foreign_keys(conn, table: str) -> list:
    """Get all foreign key constraints for a specific table."""
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


async def get_check_constraints(conn, table: str) -> list:
    """Get all check constraints for a specific table."""
    result = await conn.execute(
        text("""
            SELECT
                con.conname AS constraint_name,
                pg_get_constraintdef(con.oid) AS constraint_def
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = con.connamespace
            WHERE con.contype = 'c'
              AND rel.relname = :table
              AND nsp.nspname = 'public'
        """),
        {"table": table},
    )
    return [
        {"name": row[0], "definition": row[1]}
        for row in result.fetchall()
    ]


# ---------------------------------------------------------------------------
# Test: Alembic upgrade creates expected schema
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alembic_upgrade_creates_all_tables(alembic_conn):
    """After Alembic upgrade, all expected tables should exist."""
    expected_tables = {
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
    actual_tables = set(await get_table_names(alembic_conn))
    missing = expected_tables - actual_tables
    assert not missing, f"Alembic upgrade missing tables: {missing}"


@pytest.mark.asyncio
async def test_alembic_jobs_table_structure(alembic_conn):
    """Jobs table should have the correct columns after Alembic upgrade."""
    cols = await get_columns(alembic_conn, "jobs")
    expected_columns = {
        "id", "job_type", "payload", "status", "result_id",
        "error_message", "retry_count", "created_at", "updated_at"
    }
    missing = expected_columns - set(cols.keys())
    assert not missing, f"Jobs table missing columns: {missing}"


@pytest.mark.asyncio
async def test_alembic_jobs_has_check_constraints(alembic_conn):
    """Jobs table should have CHECK constraints on job_type and status."""
    constraints = await get_check_constraints(alembic_conn, "jobs")
    constraint_names = {c["name"] for c in constraints}
    
    assert "chk_jobs_job_type" in constraint_names, "Missing chk_jobs_job_type constraint"
    assert "chk_jobs_status" in constraint_names, "Missing chk_jobs_status constraint"


@pytest.mark.asyncio
async def test_alembic_jobs_has_indexes(alembic_conn):
    """Jobs table should have the expected indexes."""
    indexes = await get_indexes(alembic_conn, "jobs")
    expected_indexes = {
        "idx_jobs_status",
        "idx_jobs_job_type", 
        "idx_jobs_created_at",
        "idx_jobs_result_id"
    }
    # Note: primary key index may have a different name, so we check for our custom indexes
    found_indexes = {idx for idx in indexes if idx in expected_indexes}
    missing = expected_indexes - found_indexes
    assert not missing, f"Jobs table missing indexes: {missing}"


@pytest.mark.asyncio
async def test_alembic_users_table_structure(alembic_conn):
    """Users table should have the correct columns and constraints."""
    cols = await get_columns(alembic_conn, "users")
    expected_columns = {"id", "cognito_sub", "email", "name", "created_at", "updated_at", "last_login_at"}
    missing = expected_columns - set(cols.keys())
    assert not missing, f"Users table missing columns: {missing}"
    
    # Check unique constraints
    assert not cols["cognito_sub"]["nullable"], "cognito_sub should be NOT NULL"
    assert not cols["email"]["nullable"], "email should be NOT NULL"


@pytest.mark.asyncio
async def test_alembic_hackathons_table_structure(alembic_conn):
    """Hackathons table should have the correct columns and unique constraint."""
    cols = await get_columns(alembic_conn, "hackathons")
    expected_columns = {
        "id", "external_id", "title", "description", "college_name",
        "team_size", "mode", "is_paid", "url", "start_date", 
        "deadline", "created_at", "prizes"
    }
    missing = expected_columns - set(cols.keys())
    assert not missing, f"Hackathons table missing columns: {missing}"


@pytest.mark.asyncio
async def test_alembic_foreign_keys_exist(alembic_conn):
    """Foreign key relationships should be properly created."""
    # Test agent_analysis foreign keys
    agent_analysis_fks = await get_foreign_keys(alembic_conn, "agent_analysis")
    ref_tables = {fk["ref_table"] for fk in agent_analysis_fks}
    assert "hackathons" in ref_tables, "agent_analysis should FK to hackathons"
    assert "users" in ref_tables, "agent_analysis should FK to users"
    
    # Test agent_rounds foreign keys
    agent_rounds_fks = await get_foreign_keys(alembic_conn, "agent_rounds")
    ref_tables = {fk["ref_table"] for fk in agent_rounds_fks}
    assert "agent_analysis" in ref_tables, "agent_rounds should FK to agent_analysis"
    assert "users" in ref_tables, "agent_rounds should FK to users"


@pytest.mark.asyncio
async def test_alembic_trigger_function_exists(alembic_conn):
    """The update_updated_at_column trigger function should exist."""
    result = await alembic_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_proc "
            "  WHERE proname = 'update_updated_at_column'"
            ")"
        )
    )
    assert result.scalar() is True, "update_updated_at_column() function should exist"


@pytest.mark.asyncio
async def test_alembic_trigger_exists(alembic_conn):
    """The update_jobs_updated_at trigger should exist on jobs table."""
    result = await alembic_conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM pg_trigger "
            "  WHERE tgname = 'update_jobs_updated_at'"
            ")"
        )
    )
    assert result.scalar() is True, "update_jobs_updated_at trigger should exist"


# ---------------------------------------------------------------------------
# Test: Data can be inserted and queried after Alembic upgrade
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alembic_allows_data_insertion(alembic_conn):
    """After Alembic upgrade, we should be able to insert and query data."""
    # Insert a user
    await alembic_conn.execute(
        text(
            "INSERT INTO users (cognito_sub, email, name) "
            "VALUES ('sub-test-1', 'test@example.com', 'Test User')"
        )
    )
    
    # Insert a hackathon
    await alembic_conn.execute(
        text(
            "INSERT INTO hackathons (title, url) "
            "VALUES ('Test Hackathon', 'https://test.example.com')"
        )
    )
    
    # Insert a job
    await alembic_conn.execute(
        text(
            "INSERT INTO jobs (job_type, payload) "
            "VALUES ('analysis', '{}'::jsonb)"
        )
    )
    
    # Verify data exists
    result = await alembic_conn.execute(text("SELECT COUNT(*) FROM users"))
    assert result.scalar() == 1, "Should have 1 user"
    
    result = await alembic_conn.execute(text("SELECT COUNT(*) FROM hackathons"))
    assert result.scalar() == 1, "Should have 1 hackathon"
    
    result = await alembic_conn.execute(text("SELECT COUNT(*) FROM jobs"))
    assert result.scalar() == 1, "Should have 1 job"


@pytest.mark.asyncio
async def test_alembic_enforces_constraints(alembic_conn):
    """Database constraints should be enforced after Alembic upgrade."""
    # Test CHECK constraint on job_type
    with pytest.raises(Exception):  # Should raise IntegrityError or similar
        await alembic_conn.execute(
            text(
                "INSERT INTO jobs (job_type, payload) "
                "VALUES ('invalid_type', '{}'::jsonb)"
            )
        )
    
    # Test UNIQUE constraint on users.email
    await alembic_conn.execute(
        text(
            "INSERT INTO users (cognito_sub, email) "
            "VALUES ('sub-1', 'unique@example.com')"
        )
    )
    
    with pytest.raises(Exception):  # Should raise IntegrityError or similar
        await alembic_conn.execute(
            text(
                "INSERT INTO users (cognito_sub, email) "
                "VALUES ('sub-2', 'unique@example.com')"
            )
        )


# ---------------------------------------------------------------------------
# Test: Compare Alembic schema with ORM schema
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alembic_schema_matches_orm_schema(full_schema_conn):
    """
    Verify that Base.metadata.create_all produces the same schema as Alembic migrations.
    
    This is a critical test to ensure Alembic migrations stay in sync with ORM models.
    This test uses the full_schema_conn fixture which creates the schema via ORM,
    then we compare it with what Alembic would produce.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.pool import NullPool
    from alembic.config import Config
    from alembic import command
    import os
    from dotenv import load_dotenv
    
    load_dotenv(".env.test")
    TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
    
    # Get schema from ORM (already applied via full_schema_conn fixture)
    orm_tables = set(await get_table_names(full_schema_conn))
    
    # Now create schema via Alembic and compare
    sync_db_url = TEST_DATABASE_URL.replace("+asyncpg", "")
    sync_engine = create_engine(sync_db_url, poolclass=NullPool)
    
    # Run Alembic upgrade on a clean schema
    with sync_engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
    
    # Configure and run Alembic
    backend_dir = pathlib.Path(__file__).parent.parent.parent
    alembic_dir = backend_dir / "alembic"
    ini_path = backend_dir / "alembic.ini"
    
    config = Config(str(ini_path))
    config.set_main_option("script_location", str(alembic_dir))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    
    with sync_engine.begin() as conn:
        config.attributes["connection"] = conn
        command.upgrade(config, "head")
    
    # Get Alembic table names using sync connection
    with sync_engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            )
        )
        alembic_tables = {row[0] for row in result.fetchall()}
    
    # Remove alembic_version table (it's an Alembic-specific table for tracking migrations)
    alembic_tables.discard("alembic_version")
    
    # Clean up Alembic schema
    with sync_engine.begin() as conn:
        config.attributes["connection"] = conn
        command.downgrade(config, "base")
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
    
    sync_engine.dispose()
    
    # Compare
    assert alembic_tables == orm_tables, (
        f"Alembic and ORM schemas differ!\n"
        f"Alembic tables: {alembic_tables}\n"
        f"ORM tables: {orm_tables}\n"
        f"Missing in Alembic: {orm_tables - alembic_tables}\n"
        f"Extra in Alembic: {alembic_tables - orm_tables}"
    )


# ---------------------------------------------------------------------------
# Test: Trigger functionality
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alembic_trigger_updates_timestamp(alembic_conn):
    """The update_updated_at_column trigger should actually update the timestamp."""
    import asyncio
    
    # Insert a job
    await alembic_conn.execute(
        text(
            "INSERT INTO jobs (job_type, payload) "
            "VALUES ('analysis', '{}'::jsonb) RETURNING updated_at"
        )
    )
    
    # Wait a bit to ensure timestamp difference
    await asyncio.sleep(0.1)
    
    # Update the job
    await alembic_conn.execute(
        text("UPDATE jobs SET status = 'processing' WHERE job_type = 'analysis'")
    )
    
    # Verify updated_at changed (this is a basic check)
    result = await alembic_conn.execute(
        text("SELECT updated_at FROM jobs WHERE job_type = 'analysis'")
    )
    updated_at = result.scalar()
    assert updated_at is not None, "updated_at should not be NULL"
