from .database import Database
import json
from datetime import datetime

def parse_date(value):
    """Convert ISO 8601 date string to Python date object for PostgreSQL."""
    if not value:
        return None
    try:
        # Handle formats like "2026-03-31T00:00:00+05:30" or "2026-04-22"
        dt = datetime.fromisoformat(value)
        return dt.date()
    except (ValueError, TypeError):
        return None

class HackathonRepository:
    def __init__(self, db: Database):
        self.conn = db.conn

    def create(self, data: dict):
        query = """
            INSERT INTO hackathons (
                external_id,
                title,
                description,
                college_name,
                team_size,
                mode,
                is_paid,
                url,
                start_date,
                deadline,
                prizes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (url) DO NOTHING
            RETURNING id
        """

        prizes = data.get("prizes")
        if prizes and not isinstance(prizes, str):
            prizes = json.dumps(prizes)

        values = (
            data.get("external_id"),
            data.get("title"),
            data.get("description"),
            data.get("college_name"),
            json.dumps(data.get("team_size")),  # JSON field
            data.get("mode"),
            data.get("is_paid"),
            data.get("url"),
            parse_date(data.get("start_date")),
            parse_date(data.get("submission_deadline")),  # maps → deadline
            prizes,  # JSONB field
        )

        try:
            with self.conn.cursor() as cur:
                cur.execute(query, values)
                result = cur.fetchone()
                self.conn.commit()

                if result:
                    return result[0]
                return None  # duplicate

        except Exception as e:
            self.conn.rollback()
            print(f"DB error: {e}")
            return None