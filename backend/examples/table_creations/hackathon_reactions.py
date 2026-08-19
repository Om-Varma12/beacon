import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    os.getenv("DATABASE_TEST_URL"),
    sslmode="require"
)

cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS hackathon_reactions (
    user_id INTEGER NOT NULL,
    hackathon_id BIGINT NOT NULL,

    reaction VARCHAR(10) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT hackathon_reactions_pkey
        PRIMARY KEY (user_id, hackathon_id),

    CONSTRAINT hackathon_reactions_reaction_check
        CHECK (reaction IN ('like', 'dislike')),

    CONSTRAINT fk_hackathon_reaction_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_hackathon_reaction_hackathon
        FOREIGN KEY (hackathon_id)
        REFERENCES hackathons(id)
        ON DELETE CASCADE
);
""")

conn.commit()

cur.close()
conn.close()

print("hackathon_reactions table created successfully.")