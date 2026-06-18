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
CREATE TABLE IF NOT EXISTS agent_rounds (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    phase TEXT,
    ideas JSONB,
    debates JSONB,
    judge JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_agent_round_analysis
        FOREIGN KEY(analysis_id)
        REFERENCES agent_analysis(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("agent_rounds table created successfully.")