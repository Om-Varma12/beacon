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
create table public.hackathon_assets (
  id serial not null,
  hackathon_id integer null,
  user_id integer null,
  doc_content jsonb null,
  ppt_content jsonb null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint hackathon_assets_pkey primary key (id),
  constraint hackathon_assets_hackathon_id_fkey foreign KEY (hackathon_id) references hackathons (id) on delete CASCADE,
  constraint fk_hackathon_assets_user foreign key (user_id) references users (id) on delete set null
) TABLESPACE pg_default;
""")

conn.commit()

cur.close()
conn.close()

print("hackathon_assets table created successfully.")