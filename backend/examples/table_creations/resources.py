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
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,

    hackathon_id INTEGER NOT NULL,

    resource_type TEXT NOT NULL,

    title TEXT,

    url TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_hackathon_resource
        FOREIGN KEY(hackathon_id)
        REFERENCES hackathons(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("Table created successfully.")