from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, exists, func

from app.core.deps import get_current_user, get_db
from app.core.limiter import limiter
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.friendship import Friendship
from app.models.like import PostLike
from app.models.saved_post import SavedPost
from app.models.notification import Notification
from app.models.block import Block
from app.schemas.blog import PostCreate, PostOut, CommentCreate, CommentOut

router = APIRouter(prefix="/blog", tags=["blog"])

def _get_posts_with_stats_query(db: Session, viewer_id: int):
    blocks = db.query(Block).filter(
        or_(Block.blocker_id == viewer_id, Block.blocked_id == viewer_id)
    ).all()
    blocked_user_ids = [b.blocked_id if b.blocker_id == viewer_id else b.blocker_id for b in blocks]
    if not blocked_user_ids:
        blocked_user_ids = [-1]

    friendship_exists = exists().where(or_(
        and_(Friendship.user_a_id == Post.author_id, Friendship.user_b_id == viewer_id),
        and_(Friendship.user_b_id == Post.author_id, Friendship.user_a_id == viewer_id),
    ))
    
    visibility_filter = or_(
        and_(Post.status == "published", Post.visibility == "public"),
        and_(Post.status == "published", Post.visibility == "friends", friendship_exists),
        Post.author_id == viewer_id
    )

    return db.query(
        Post,
        User,
        func.count(PostLike.id.distinct()).label('likes_count'),
        func.count(Comment.id.distinct()).label('comments_count'),
        func.bool_or(PostLike.user_id == viewer_id).label('is_liked'),
        func.bool_or(SavedPost.user_id == viewer_id).label('is_saved')
    ).join(User, User.id == Post.author_id)\
     .outerjoin(PostLike, PostLike.post_id == Post.id)\
     .outerjoin(Comment, Comment.post_id == Post.id)\
     .outerjoin(SavedPost, SavedPost.post_id == Post.id)\
     .filter(~Post.author_id.in_(blocked_user_ids), visibility_filter)\
     .group_by(Post.id, User.id)

def _row_to_post_out(row) -> PostOut:
    post, author, likes_count, comments_count, is_liked, is_saved = row
    return PostOut(
        id=post.id, author_id=post.author_id, author_username=author.username,
        author_avatar_url=author.avatar_url,
        title=post.title, content=post.content, visibility=post.visibility,
        status=post.status, created_at=post.created_at,
        likes_count=likes_count, comments_count=comments_count,
        is_liked=bool(is_liked), is_saved=bool(is_saved)
    )

@router.post("", response_model=PostOut, status_code=201)
@limiter.limit("20/minute")
def create_post(request: Request, payload: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = Post(author_id=current_user.id, **payload.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    # To return immediately, we can just query it via our optimized function
    row = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post.id).first()
    return _row_to_post_out(row)

@router.get("/feed", response_model=list[PostOut])
def get_feed(cursor: Optional[datetime] = Query(None), limit: int = Query(20, le=50), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = _get_posts_with_stats_query(db, current_user.id)
    if cursor:
        q = q.filter(Post.created_at < cursor)
    rows = q.order_by(Post.created_at.desc()).limit(limit).all()
    return [_row_to_post_out(row) for row in rows]

@router.get("/posts/mine", response_model=list[PostOut])
def my_posts(cursor: Optional[datetime] = Query(None), limit: int = Query(20, le=50), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = _get_posts_with_stats_query(db, current_user.id).filter(Post.author_id == current_user.id)
    if cursor:
        q = q.filter(Post.created_at < cursor)
    rows = q.order_by(Post.created_at.desc()).limit(limit).all()
    return [_row_to_post_out(row) for row in rows]

@router.get("/posts/saved", response_model=list[PostOut])
def saved_posts(cursor: Optional[datetime] = Query(None), limit: int = Query(20, le=50), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = _get_posts_with_stats_query(db, current_user.id).filter(SavedPost.user_id == current_user.id)
    # We join SavedPost above but the bool_or handles is_saved. Wait, the group_by applies to Post, so filter(SavedPost.user_id == ...) will filter out posts the user didn't save.
    if cursor:
        q = q.filter(Post.created_at < cursor)
    rows = q.order_by(Post.created_at.desc()).limit(limit).all()
    return [_row_to_post_out(row) for row in rows]

@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post_id).first()
    if not row:
        raise HTTPException(404, "Post not found")
    return _row_to_post_out(row)

@router.put("/posts/{post_id}", response_model=PostOut)
def update_post(post_id: int, payload: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.author_id == current_user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    for field, value in payload.model_dump().items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    row = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post.id).first()
    return _row_to_post_out(row)

@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.author_id == current_user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()

@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=201)
@limiter.limit("20/minute")
def add_comment(request: Request, post_id: int, payload: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    comment = Comment(post_id=post_id, author_id=current_user.id, content=payload.content, parent_id=payload.parent_id)
    db.add(comment)
    
    if post[0].author_id != current_user.id:
        db.add(Notification(user_id=post[0].author_id, actor_id=current_user.id, post_id=post[0].id, type="blog_comment"))

    db.commit()
    db.refresh(comment)
    return CommentOut(id=comment.id, post_id=post_id, author_id=current_user.id,
                       author_username=current_user.username, author_avatar_url=current_user.avatar_url, content=comment.content, created_at=comment.created_at, is_pinned=comment.is_pinned, parent_id=comment.parent_id)

@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    
    # N+1 query fix for comments too
    rows = db.query(Comment, User).join(User, User.id == Comment.author_id)\
             .filter(Comment.post_id == post_id)\
             .order_by(Comment.is_pinned.desc(), Comment.created_at.asc()).all()
    out = []
    for c, author in rows:
        out.append(CommentOut(id=c.id, post_id=post_id, author_id=c.author_id,
                               author_username=author.username, author_avatar_url=author.avatar_url, content=c.content, created_at=c.created_at, is_pinned=c.is_pinned, parent_id=c.parent_id))
    return out

@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=204)
def delete_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.post_id == post_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.author_id != current_user.id and post.author_id != current_user.id:
        raise HTTPException(403, "Not authorized to delete this comment")
    db.delete(comment)
    db.commit()

@router.post("/posts/{post_id}/comments/{comment_id}/pin", status_code=201)
def pin_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(403, "Only the post author can pin comments")
    
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.post_id == post_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
        
    if not comment.is_pinned:
        pinned_count = db.query(Comment).filter(Comment.post_id == post_id, Comment.is_pinned == True).count()
        if pinned_count >= 3:
            raise HTTPException(400, "Maximum of 3 pinned comments allowed")
            
    comment.is_pinned = not comment.is_pinned
    db.commit()
    return {"message": "Comment pinned" if comment.is_pinned else "Comment unpinned"}

@router.post("/posts/{post_id}/like", status_code=201)
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    existing = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if not existing:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        
        if post[0].author_id != current_user.id:
            db.add(Notification(user_id=post[0].author_id, actor_id=current_user.id, post_id=post[0].id, type="blog_like"))

        db.commit()
    return {"message": "Liked"}

@router.delete("/posts/{post_id}/like", status_code=204)
def unlike_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).delete()
    db.commit()
    
@router.post("/posts/{post_id}/save", status_code=201)
def save_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = _get_posts_with_stats_query(db, current_user.id).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    existing = db.query(SavedPost).filter(SavedPost.post_id == post_id, SavedPost.user_id == current_user.id).first()
    if not existing:
        db.add(SavedPost(post_id=post_id, user_id=current_user.id))
        db.commit()
    return {"message": "Saved"}

@router.delete("/posts/{post_id}/save", status_code=204)
def unsave_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(SavedPost).filter(SavedPost.post_id == post_id, SavedPost.user_id == current_user.id).delete()
    db.commit()
