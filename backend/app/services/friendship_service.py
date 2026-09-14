from sqlalchemy.orm import Session
from app.models.friendship import Friendship

def are_friends(db: Session, user_id_1: int, user_id_2: int) -> bool:
    a, b = sorted([user_id_1, user_id_2])
    return db.query(Friendship).filter(
        Friendship.user_a_id == a, Friendship.user_b_id == b
    ).first() is not None
