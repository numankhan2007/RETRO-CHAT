from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS otp_code, DROP COLUMN IF EXISTS otp_expires_at, DROP COLUMN IF EXISTS otp_attempts;"))
    db.commit()
    print("Dropped columns successfully")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
