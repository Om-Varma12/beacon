# Beacon Backend Tests

This directory contains the test suite for the Beacon backend. The tests are designed to be run both locally during development and in a CI/CD pipeline.

## Prerequisites

Before running the tests, you must have a PostgreSQL database and Redis running. The easiest way to start these services locally is using the provided Docker Compose file.

**1. Start the test database and services:**
```bash
docker compose -f docker-compose.test.yml up -d
```

**2. Configure your environment:**
Ensure your `.env.test` file or environment variables include a valid test database URL pointing to your running Docker container, for example:
```env
TEST_DATABASE_URL=postgresql+asyncpg://postgres:testpassword@localhost:5433/beacon_test
```
*(Note: It is highly recommended to use a separate database for testing, as the migration tests will drop and recreate schemas.)*

## Test Suites

The tests are organized into distinct layers, which can be run together or separately.

### 1. Main Suite (API, Unit, Repositories)
This suite covers the application logic, API routing, background workers, and database repository layer. 

**Important:** The repository tests run against a real database but use a transaction-rollback strategy. This means every test runs in an isolated transaction that is instantly rolled back when the test finishes, keeping your test database completely clean.

**To run the main suite:**
```bash
uv run pytest tests/api/ tests/unit/ tests/repos/ -v
```

### 2. Migration & Schema Suite
This suite verifies database schema integrity and migration behavior. It includes three types of tests:

- **Alembic Migration Tests** (`test_alembic_migrations.py`): Tests that Alembic migrations work correctly, including upgrades, downgrades, and schema consistency with ORM models
- **Schema Integrity Tests** (`test_schema_integrity.py`): Verifies that SQLAlchemy ORM models produce the expected schema structure
- **Constraint Tests** (`test_constraints.py`): Tests that database-level constraints actually fire and reject invalid data
- **Raw SQL Migration Tests** (`test_sql_migration.py`): Tests legacy raw SQL migrations (deprecated)

**⚠️ WARNING:** These tests are highly destructive. They use `DROP SCHEMA public CASCADE` to ensure a zero-state environment before running. 
Because this behavior conflicts with the fast transaction-rollback strategy used by the main suite, **migration tests must be run separately**. They are explicitly ignored in the default `pytest.ini` run.

**To run the migration suite:**
```bash
uv run pytest tests/migrations/ -v
```

**To run only Alembic migration tests:**
```bash
uv run pytest tests/migrations/test_alembic_migrations.py -v
```

## Running Specific Layers

If you want to focus on a specific area during development, you can target individual folders:

- **API Tests:** `uv run pytest tests/api/`
- **Unit Tests (Workers):** `uv run pytest tests/unit/`
- **Repository Tests (Database):** `uv run pytest tests/repos/`
- **Migration Tests (Destructive):** `uv run pytest tests/migrations/`
- **Alembic Migration Tests:** `uv run pytest tests/migrations/test_alembic_migrations.py`

## CI/CD Usage

These tests are fully ready for CI/CD pipelines (e.g., GitHub Actions). 
To run them in CI/CD:
1. Spin up a PostgreSQL service container.
2. Set the `TEST_DATABASE_URL` environment variable pointing to the container.
3. Run the Main Suite, followed by the Migration Suite as two separate steps.

## Migration Testing Strategy

The migration tests use two different approaches to verify schema integrity:

1. **Alembic Tests**: Use the `alembic_conn` fixture which runs actual Alembic migrations up/down, ensuring the migration system works correctly
2. **ORM Tests**: Use the `full_schema_conn` fixture which uses `Base.metadata.create_all` to verify ORM model definitions are correct

Both approaches are important:
- Alembic tests ensure your migration system works
- ORM tests ensure your model definitions are correct
- Together they ensure your migrations stay in sync with your models
