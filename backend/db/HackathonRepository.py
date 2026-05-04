from .database import Database
import json
from datetime import datetime

def parse_date(value):
    """Convert ISO 8601 string to Python date."""
    if not value:
        return None

    try:
        dt = datetime.fromisoformat(value)
        return dt.date()

    except (ValueError, TypeError):
        return None


class HackathonRepository:
    def __init__(self, db: Database):
        self.db = db

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
            json.dumps(data.get("team_size")),
            data.get("mode"),
            data.get("is_paid"),
            data.get("url"),
            parse_date(data.get("start_date")),
            parse_date(data.get("submission_deadline")),
            prizes if prizes else None,
        )
        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, values)
                result = cur.fetchone()
                
            conn.commit()
            
            if result:
                return result[0]
            return None

        except Exception as e:
            conn.rollback()
            print(f"DB error: {e}")
            return None

        finally:
            self.db.release_conn(conn)
            
            
    def get_all(self, limit=12, offset=0, sort_by="start_date", order="asc"):
        conn = self.db.get_conn()
        try:
            # ⚠️ whitelist to prevent SQL injection
            allowed_fields = ["start_date", "deadline", "id"]
            if sort_by not in allowed_fields:
                sort_by = "start_date"

            order = "ASC" if order.lower() == "asc" else "DESC"

            query = f"""
                SELECT *
                FROM hackathons
                WHERE deadline IS NULL OR deadline >= CURRENT_DATE
                ORDER BY {sort_by} {order}
                LIMIT %s OFFSET %s
            """

            with conn.cursor() as cur:
                cur.execute(query, (limit, offset))
                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                return [dict(zip(columns, row)) for row in rows]

        finally:
            self.db.release_conn(conn)