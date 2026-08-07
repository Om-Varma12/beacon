"""
Script to run the jobs table migration.

⚠️ DEPRECATED: This script is deprecated and should not be used.
The project now uses Alembic for database migrations.

Please use Alembic instead:
    alembic upgrade head

For more information, see the README.md file in the backend directory.
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def run_migration():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment variables")
        return False

    try:
        # Parse DATABASE_URL (format: postgresql://user:password@host:port/dbname)
        # For psycopg2, we need to extract components
        if database_url.startswith("postgresql://"):
            db_url = database_url.replace("postgresql://", "")
            if "@" in db_url:
                auth_part, host_part = db_url.split("@")
                if ":" in auth_part:
                    user, password = auth_part.split(":")
                else:
                    user = auth_part
                    password = ""
                
                if "/" in host_part:
                    host_port, dbname = host_part.split("/")
                    if ":" in host_port:
                        host, port = host_port.split(":")
                    else:
                        host = host_port
                        port = "5432"
                else:
                    host = host_part
                    port = "5432"
                    dbname = "postgres"
            else:
                print("ERROR: Invalid DATABASE_URL format")
                return False
        else:
            print("ERROR: DATABASE_URL must start with postgresql://")
            return False

        # Connect to database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=dbname,
            user=user,
            password=password
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Read and execute migration
        with open("db/migrations/001_create_jobs_table.sql", "r") as f:
            migration_sql = f.read()
        
        cursor.execute(migration_sql)
        
        print("✓ Migration completed successfully!")
        print("✓ Jobs table created in PostgreSQL")
        
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("Running jobs table migration...")
    success = run_migration()
    if not success:
        exit(1)
