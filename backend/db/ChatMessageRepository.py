from .database import Database


class ChatMessageRepository:
    def __init__(self, db: Database):
        self.db = db


    def create(
        self,
        hackathon_id: int,
        role: str,
        content: str
    ):
        query = """
            INSERT INTO chat_messages (
                hackathon_id,
                role,
                content
            )
            VALUES (%s, %s, %s)
            RETURNING id
        """

        values = (
            hackathon_id,
            role,
            content
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
                f"DB error (ChatMessageRepository.create): {e}"
            )
            return None

        finally:
            self.db.release_conn(conn)


    def get_recent_by_hackathon_id(
        self,
        hackathon_id: int,
        limit: int = 10
    ):
        query = """
            SELECT *
            FROM chat_messages
            WHERE hackathon_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        conn = self.db.get_conn()

        try:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (hackathon_id, limit)
                )
                
                rows = cur.fetchall()
                
                columns = [
                    desc[0]
                    for desc in cur.description
                ]

                messages = [
                    dict(zip(columns, row))
                    for row in rows
                ]

                # Reverse so conversation flows correctly
                messages.reverse()

                return messages

        except Exception as e:
            print(
                "DB error "
                "(ChatMessageRepository.get_recent_by_hackathon_id): "
                f"{e}"
            )

            return []

        finally:
            self.db.release_conn(conn)