import psycopg2
import os
from dotenv import load_dotenv
import json

load_dotenv()


class Database:
    def __init__(self):
        self.conn = psycopg2.connect(
            os.getenv("DATABASE_URL"),
            sslmode="require"
        )