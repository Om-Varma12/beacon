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
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,

    hackathon_id INTEGER NOT NULL,

    role TEXT NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_chat_message_hackathon
        FOREIGN KEY(hackathon_id)
        REFERENCES hackathons(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("chat_messages table created successfully.")