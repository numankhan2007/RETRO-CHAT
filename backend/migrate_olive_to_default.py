from sqlalchemy import text
from app.db.database import engine

def main():
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET accent_color = 'default' WHERE accent_color = 'olive'"))
        print("Updated olive to default.")

if __name__ == "__main__":
    main()
