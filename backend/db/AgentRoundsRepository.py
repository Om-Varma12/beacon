import json

from db.database import Database


class AgentRoundsRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(self, analysis_id: int, round_number: int, data: dict):
        query = """
            INSERT INTO agent_rounds (
                analysis_id,
                round_number,
                phase,
                ideas,
                debates,
                judge
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            analysis_id,
            round_number,
            data.get("phase"),
            json.dumps(
                data.get("ideas", [])
            ),
            json.dumps(
                data.get("debates", [])
            ),
            json.dumps(
                data.get("judge", {})
            ),
        )
        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, values)
                row = cur.fetchone()
                
            conn.commit()

            if row:
                return row[0]

            return None

        except Exception as e:
            conn.rollback()
            print(
                f"DB error (AgentRoundsRepository.create): {e}"
            )
            return None

        finally:
            self.db.release_conn(conn)