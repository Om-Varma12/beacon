import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    os.getenv("DATABASE_URL"),
    sslmode="require"
)

cur = conn.cursor()

# 1. Add user_id to agent_analysis
cur.execute("""
ALTER TABLE agent_analysis
ADD COLUMN IF NOT EXISTS user_id INTEGER NULL,
ADD CONSTRAINT fk_agent_analysis_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;
""")
print("✅ agent_analysis: user_id column added.")

# 2. Add user_id to agent_rounds
cur.execute("""
ALTER TABLE agent_rounds
ADD COLUMN IF NOT EXISTS user_id INTEGER NULL,
ADD CONSTRAINT fk_agent_rounds_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;
""")
print("✅ agent_rounds: user_id column added.")

# 3. Add user_id to hackathon_assets
cur.execute("""
ALTER TABLE hackathon_assets
ADD COLUMN IF NOT EXISTS user_id INTEGER NULL,
ADD CONSTRAINT fk_hackathon_assets_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;
""")
print("✅ hackathon_assets: user_id column added.")

conn.commit()

cur.close()
conn.close()

print("\n🎉 Migration complete. user_id added to all 3 tables.")
