from psycopg2.pool import SimpleConnectionPool
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    _instance: 'Database' = None
    _pool = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._pool is not None:
            return
        self._pool = SimpleConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=os.getenv("DATABASE_URL")
        )

    @property
    def pool(self):
        return self._pool

    def get_conn(self):
        return self._pool.getconn()

    def release_conn(self, conn):
        self._pool.putconn(conn)

    def close_all(self):
        """Close all connections in the pool."""
        if self._pool:
            self._pool.closeall()