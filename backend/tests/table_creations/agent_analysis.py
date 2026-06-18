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
CREATE TABLE IF NOT EXISTS agent_analysis (
    id SERIAL PRIMARY KEY,
    hackathon_id INTEGER NOT NULL,
    winner TEXT,
    leaderboard JSONB,
    final_scores JSONB,
    winning_idea JSONB,
    synthesized JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_agent_analysis_hackathon
        FOREIGN KEY(hackathon_id)
        REFERENCES hackathons(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("agent_analysis table created successfully.")