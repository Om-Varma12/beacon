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
INSERT INTO public.hackathons (
  id, title, details, url, prizes, college_name, address
)
VALUES (%s, %s, %s, %s, %s, %s, %s)
""", (
  1,
  "AI Innovation Hackathon",
  "Build cutting-edge AI solutions for real-world problems.",
  "https://example.com/hackathon",
  '{"first": "₹50,000", "second": "₹30,000"}',
  "IIT Bombay",
  '{"city": "Mumbai", "state": "Maharashtra"}'
))

conn.commit()

print("✅ Connected to Supabase")

conn.close()