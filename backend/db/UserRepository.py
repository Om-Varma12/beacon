from .database import Database

class UserRepository:
    def __init__(self, db: Database):
        self.db = db

    def get_or_create_user(self, cognito_sub: str, email: str, name: str):
        conn = self.db.get_conn()
        try:
            with conn.cursor() as cur:
                # 1. Try to fetch by cognito_sub
                cur.execute("""
                    SELECT name, email
                    FROM users
                    WHERE cognito_sub = %s
                """, (cognito_sub,))
                row = cur.fetchone()
                if row:
                    # Update last login time and name
                    cur.execute("""
                        UPDATE users
                        SET last_login_at = NOW(), name = %s, updated_at = NOW()
                        WHERE cognito_sub = %s
                    """, (name, cognito_sub))
                    conn.commit()
                    return {"name": name, "email": row[1]}

                # 2. Try to fetch by email if sub didn't match
                cur.execute("""
                    SELECT name, email
                    FROM users
                    WHERE email = %s
                """, (email,))
                row = cur.fetchone()
                if row:
                    # Link sub and update name and last login time
                    cur.execute("""
                        UPDATE users
                        SET cognito_sub = %s, name = %s, last_login_at = NOW(), updated_at = NOW()
                        WHERE email = %s
                    """, (cognito_sub, name, email))
                    conn.commit()
                    return {"name": name, "email": email}

                # 3. Create a new user if neither matched
                cur.execute("""
                    INSERT INTO users (cognito_sub, email, name, last_login_at)
                    VALUES (%s, %s, %s, NOW())
                    RETURNING name, email
                """, (cognito_sub, email, name))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return {"name": row[0], "email": row[1]}
                return None
        except Exception as e:
            conn.rollback()
            print(f"DB error (UserRepository.get_or_create_user): {e}")
            return None
        finally:
            self.db.release_conn(conn)
