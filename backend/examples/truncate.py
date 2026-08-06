import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    os.getenv("DATABASE_URL"),
    sslmode="require"
)

try:
    with conn.cursor() as cur:

        cur.execute("""
            TRUNCATE TABLE
                problem_statements,
                resources,
                hackathons,
                chat_messages,
                agent_analysis,
                agent_rounds
            RESTART IDENTITY CASCADE;
        """)

    conn.commit()

    print("All tables truncated successfully.")

except Exception as e:
    conn.rollback()

    print(f"Error truncating tables: {e}")

finally:
    conn.close()