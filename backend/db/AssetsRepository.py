import json
from db.database import Database

class AssetsRepository:
    def __init__(self, db: Database):
        self.db = db

    def create(self, hackathon_id: int, doc_content: dict, ppt_content: dict, user_id: int = None):
        # Let's check if assets already exist for this hackathon and user
        existing = self.get_by_hackathon_id(hackathon_id, user_id)
        
        if existing:
            if user_id is not None:
                query = """
                    UPDATE hackathon_assets
                    SET doc_content = %s,
                        ppt_content = %s,
                        created_at = CURRENT_TIMESTAMP
                    WHERE hackathon_id = %s AND user_id = %s
                    RETURNING id
                """
                values = (
                    json.dumps(doc_content),
                    json.dumps(ppt_content),
                    hackathon_id,
                    user_id
                )
            else:
                query = """
                    UPDATE hackathon_assets
                    SET doc_content = %s,
                        ppt_content = %s,
                        created_at = CURRENT_TIMESTAMP
                    WHERE hackathon_id = %s AND user_id IS NULL
                    RETURNING id
                """
                values = (
                    json.dumps(doc_content),
                    json.dumps(ppt_content),
                    hackathon_id
                )
        else:
            query = """
                INSERT INTO hackathon_assets (
                    hackathon_id,
                    user_id,
                    doc_content,
                    ppt_content
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """
            values = (
                hackathon_id,
                user_id,
                json.dumps(doc_content),
                json.dumps(ppt_content)
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
            print(f"DB error (AssetsRepository.create): {e}")
            return None
        finally:
            self.db.release_conn(conn)

    def get_by_hackathon_id(self, hackathon_id: int, user_id: int = None):
        if user_id is not None:
            query = """
                SELECT id, hackathon_id, doc_content, ppt_content, created_at
                FROM hackathon_assets
                WHERE hackathon_id = %s AND user_id = %s
                LIMIT 1
            """
            params = (hackathon_id, user_id)
        else:
            query = """
                SELECT id, hackathon_id, doc_content, ppt_content, created_at
                FROM hackathon_assets
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
            print(f"DB error (AssetsRepository.get_by_hackathon_id): {e}")
            return None
        finally:
            self.db.release_conn(conn)
