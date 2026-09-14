from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.post import Post
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).all()
    
    if not notifs:
        return []

    # Bulk fetch actors and posts to avoid N+1
    actor_ids = list({n.actor_id for n in notifs})
    post_ids = list({n.post_id for n in notifs if n.post_id})
    
    actors = {u.id: u for u in db.query(User).filter(User.id.in_(actor_ids)).all()}
    posts = {p.id: p for p in db.query(Post).filter(Post.id.in_(post_ids)).all()} if post_ids else {}
    
    out = []
    for n in notifs:
        actor = actors.get(n.actor_id)
        post = posts.get(n.post_id) if n.post_id else None
        
        out.append(NotificationOut(
            id=n.id,
            user_id=n.user_id,
            actor_id=n.actor_id,
            actor_username=actor.username if actor else "Unknown",
            actor_name=actor.name if actor else "Unknown",
            post_id=n.post_id,
            post_title=post.title if post else None,
            type=n.type,
            is_read=n.is_read,
            created_at=n.created_at
        ))
    return out

@router.post("/{notification_id}/read", status_code=204)
def mark_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()

@router.post("/read-all", status_code=204)
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
