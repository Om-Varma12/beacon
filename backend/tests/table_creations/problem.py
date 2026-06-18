import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    os.getenv("DATABASE_URL"),
    sslmode="require"
)

cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS problem_statements (
    id SERIAL PRIMARY KEY,

    hackathon_id INTEGER NOT NULL,

    title TEXT,
    description TEXT,

    type TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_hackathon_problem
        FOREIGN KEY(hackathon_id)
        REFERENCES hackathons(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("Table created successfully.")