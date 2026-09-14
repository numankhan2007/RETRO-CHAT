from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.schemas.theme import ThemeUpdate
from fastapi import HTTPException
from app.core.config import settings
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import uuid

router = APIRouter(prefix="/users", tags=["users"])

def get_s3_client():
    if not settings.r2_account_id or not settings.r2_access_key_id:
        return None
    
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )

@router.put("/me", response_model=UserOut)
def update_profile(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.username and payload.username != current_user.username:
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/theme", response_model=UserOut)
def update_theme(payload: ThemeUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account successfully deleted"}

@router.post("/me/avatar/presigned-url")
def get_avatar_presigned_url(
    payload: __import__('app.schemas.user', fromlist=['AvatarUploadRequest']).AvatarUploadRequest,
    current_user: User = Depends(get_current_user)
):
    s3_client = get_s3_client()
    if not s3_client:
        raise HTTPException(status_code=501, detail="R2 storage is not configured on the server")
    if not settings.r2_bucket_name:
         raise HTTPException(status_code=501, detail="R2 bucket is not configured on the server")

    object_key = f"avatars/{current_user.id}/{uuid.uuid4().hex}.webp"

    try:
        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": object_key,
                "ContentType": payload.content_type,
            },
            ExpiresIn=300,
        )
        return {"upload_url": url, "object_key": object_key, "expires_in": 300}
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

@router.post("/me/avatar/complete", response_model=UserOut)
def complete_avatar_upload(
    payload: __import__('app.schemas.user', fromlist=['AvatarCompleteRequest']).AvatarCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.object_key.startswith(f"avatars/{current_user.id}/"):
        raise HTTPException(status_code=403, detail="Unauthorized object key")
    
    if not settings.r2_public_url:
        raise HTTPException(status_code=501, detail="R2 public URL is not configured")

    public_url = f"{settings.r2_public_url}/{payload.object_key}"
    current_user.avatar_url = public_url
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/search", response_model=list[UserOut])
def search_users(q: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not q or len(q) < 1:
        return []
    
    users = db.query(User).filter(
        (User.id != current_user.id) &
        (User.username.ilike(f"%{q}%"))
    ).limit(10).all()
    
    return users
