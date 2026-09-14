"""
Run once after the schema exists, to have real data to build against.
Usage: python -m app.db.seed
"""
from app.db.database import SessionLocal
from app.models.user import User
from app.models.friendship import Friendship
from passlib.hash import bcrypt

def seed():
    db = SessionLocal()
    try:
        u1 = User(email="ramesh@example.com", username="ramesh_k",
                  password_hash=bcrypt.hash("testpass123"), is_verified=True)
        u2 = User(email="anita@example.com", username="anita_m",
                  password_hash=bcrypt.hash("testpass123"), is_verified=True)
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        a, b = sorted([u1.id, u2.id])
        db.add(Friendship(user_a_id=a, user_b_id=b))
        db.commit()
        print(f"Seeded {u1.username} and {u2.username} as friends.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
