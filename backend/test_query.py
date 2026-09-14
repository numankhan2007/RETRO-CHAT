import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, exists
from app.db.database import SessionLocal
from app.models.post import Post
from app.models.user import User
from app.models.like import PostLike
from app.models.comment import Comment
from app.models.saved_post import SavedPost

db = SessionLocal()
viewer_id = 1

query = db.query(
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
 .group_by(Post.id, User.id)

print(query.limit(2).all())
db.close()
