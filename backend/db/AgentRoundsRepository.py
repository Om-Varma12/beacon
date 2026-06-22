import json

from db.database import Database


class AgentRoundsRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(self, analysis_id: int, round_number: int, data: dict, user_id: int = None):
        query = """
            INSERT INTO agent_rounds (
                analysis_id,
                user_id,
                round_number,
                phase,
                ideas,
                debates,
                judge
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            analysis_id,
            user_id,
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
            
    def get_by_analysis_id(self, analysis_id: int):
        query = """
            SELECT *
            FROM agent_rounds
            WHERE analysis_id = %s
            ORDER BY round_number ASC
        """

        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, (analysis_id,))
                rows = cur.fetchall()

                columns = [desc[0] for desc in cur.description]

                return [
                    dict(zip(columns, row))
                    for row in rows
                ]

        except Exception as e:
            print(
                f"DB error (AgentRoundsRepository.get_by_analysis_id): {e}"
            )
            return []

        finally:
            self.db.release_conn(conn)