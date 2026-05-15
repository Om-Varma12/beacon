import json

from db.database import Database


class AgentAnalysisRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(self, hackathon_id: int, result: dict):
        query = """
            INSERT INTO agent_analysis (
                hackathon_id,
                winner,
                leaderboard,
                final_scores,
                winning_idea,
                synthesized
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            hackathon_id,
            result.get("winner"),
            json.dumps(
                result.get("leaderboard", [])
            ),
            json.dumps(
                result.get("final_scores", {})
            ),
            json.dumps(
                result.get("winning_idea", {})
            ),
            json.dumps(
                result.get("synthesized", {})
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
                f"DB error (AgentAnalysisRepository.create): {e}"
            )
            return None

        finally:
            self.db.release_conn(conn)