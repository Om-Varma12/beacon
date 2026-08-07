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
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    cognito_sub VARCHAR(255) UNIQUE NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    name VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    last_login_at TIMESTAMP
);
""")

conn.commit()

cur.close()
conn.close()

print("Users table created successfully.")