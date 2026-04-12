from .database import Database

class ThemeRepository:
    def __init__(self, db: Database):
        self.conn = db.conn

    def create_bulk(self, hackathon_id, themes):
        query = """
            INSERT INTO themes (hackathon_id, name)
            VALUES (%s, %s)
        """

        with self.conn.cursor() as cur:
            for theme in themes:
                cur.execute(query, (hackathon_id, theme))
        self.conn.commit()