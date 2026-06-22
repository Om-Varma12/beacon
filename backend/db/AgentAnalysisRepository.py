import json

from db.database import Database


class AgentAnalysisRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(self, hackathon_id: int, result: dict, user_id: int = None):
        query = """
            INSERT INTO agent_analysis (
                hackathon_id,
                user_id,
                winner,
                leaderboard,
                final_scores,
                winning_idea,
                synthesized
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            hackathon_id,
            user_id,
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
            
    def get_by_hackathon_id(self, hackathon_id: int, user_id: int = None):
        if user_id is not None:
            query = """
                SELECT *
                FROM agent_analysis
                WHERE hackathon_id = %s AND user_id = %s
                LIMIT 1
            """
            params = (hackathon_id, user_id)
        else:
            query = """
                SELECT *
                FROM agent_analysis
                WHERE hackathon_id = %s AND user_id IS NULL
                LIMIT 1
            """
            params = (hackathon_id,)

        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                row = cur.fetchone()
                if not row:
                    return None

                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))

        except Exception as e:
            print(
                f"DB error (AgentAnalysisRepository.get_by_hackathon_id): {e}"
            )
            return None

        finally:
            self.db.release_conn(conn)