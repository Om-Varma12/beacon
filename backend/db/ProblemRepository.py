from .database import Database


class ProblemRepository:
    def __init__(self, db: Database):
        self.db = db

    def create(self, hackathon_id: int, data: dict):
        query = """
            INSERT INTO problem_statements (
                hackathon_id,
                title,
                description,
                type
            )
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """

        values = (
            hackathon_id,
            data.get("title"),
            data.get("description"),
            data.get("type"),
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
            print(f"DB error (ProblemRepository.create): {e}")
            return None

        finally:
            self.db.release_conn(conn)
