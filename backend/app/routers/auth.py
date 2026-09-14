from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.services.email_service import generate_otp, send_otp_email
from app.services.redis_service import store_otp, verify_and_consume_otp, clear_otp
from app.schemas.user import UserRegister, UserLogin, OTPVerify, UserOut, ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest
from app.schemas.token import Token

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_OTP_ATTEMPTS = 5

@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(func.lower(User.email) == func.lower(payload.email)).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(func.lower(User.username) == func.lower(payload.username)).first():
        raise HTTPException(400, "Username already taken")
    if payload.password != payload.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    otp = generate_otp()
    user = User(
        email=payload.email, name=payload.name, username=payload.username,
        password_hash=hash_password(payload.password), is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    store_otp(user.email, otp)
    await send_otp_email(payload.email, otp)
    return user

@router.post("/verify-otp")
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == func.lower(payload.email)).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_and_consume_otp(user.email, payload.otp, max_attempts=MAX_OTP_ATTEMPTS, consume=True):
        raise HTTPException(400, "Invalid, expired, or too many incorrect attempts")

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}

class ResendOTPRequest(BaseModel):
    email: EmailStr

@router.post("/resend-otp")
async def resend_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == func.lower(payload.email)).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_verified:
        raise HTTPException(400, "Email already verified")

    otp = generate_otp()
    store_otp(user.email, otp)
    await send_otp_email(payload.email, otp)
    return {"message": "A new verification code has been sent"}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(payload.identifier)) | 
        (func.lower(User.username) == func.lower(payload.identifier))
    ).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    otp = generate_otp()
    store_otp(user.email, otp)
    await send_otp_email(user.email, otp)
    return {"message": "A password reset code has been sent to your email", "email": user.email}

@router.post("/verify-reset-otp")
def verify_reset_otp(payload: VerifyResetOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(payload.identifier)) | 
        (func.lower(User.username) == func.lower(payload.identifier))
    ).first()
    
    if not user:
        raise HTTPException(404, "User not found")
        
    # We do NOT consume here because the reset-password endpoint needs to verify it again
    if not verify_and_consume_otp(user.email, payload.otp, max_attempts=MAX_OTP_ATTEMPTS, consume=False):
        raise HTTPException(400, "Invalid, expired, or too many incorrect attempts")

    return {"message": "OTP is valid"}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(payload.identifier)) | 
        (func.lower(User.username) == func.lower(payload.identifier))
    ).first()
    
    if not user:
        raise HTTPException(404, "User not found")
        
    # This time we consume the OTP
    if not verify_and_consume_otp(user.email, payload.otp, max_attempts=MAX_OTP_ATTEMPTS, consume=True):
        raise HTTPException(400, "Invalid, expired, or too many incorrect attempts")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password has been reset successfully"}

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(payload.identifier)) | 
        (func.lower(User.username) == func.lower(payload.identifier))
    ).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Incorrect username/email or password")
    if not user.is_verified:
        raise HTTPException(403, "Please verify your email before logging in")
    return Token(access_token=create_access_token({"sub": str(user.id)}))

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/stats")
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.post import Post
    from app.models.friendship import Friendship
    from sqlalchemy import or_, func
    
    posts_count = db.query(func.count(Post.id)).filter(Post.author_id == current_user.id).scalar() or 0
    friends_count = db.query(func.count(Friendship.id)).filter(
        or_(Friendship.user_a_id == current_user.id, Friendship.user_b_id == current_user.id)
    ).scalar() or 0
    
    return {"posts_count": posts_count, "friends_count": friends_count}

