from db.database import Database


class ResourceRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(self, hackathon_id: int, data: dict):
        query = """
            INSERT INTO resources (
                hackathon_id,
                resource_type,
                title,
                url
            )
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """

        values = (
            hackathon_id,
            data.get("resource_type"),
            data.get("title"),
            data.get("url"),
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
            print(f"DB error (ResourceRepository.create): {e}")
            return None

        finally:
            self.db.release_conn(conn)
            
    
    def get_by_hackathon_id(self, hackathon_id: int):
        query = """
            SELECT
                id,
                resource_type,
                title,
                url
            FROM resources
            WHERE hackathon_id = %s
            ORDER BY id ASC
        """

        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(query, (hackathon_id,))
                rows = cur.fetchall()

                columns = [desc[0] for desc in cur.description]

                return [
                    dict(zip(columns, row))
                    for row in rows
                ]

        except Exception as e:
            print(f"DB error (ResourceRepository.get_by_hackathon_id): {e}")
            return []

        finally:
            self.db.release_conn(conn)