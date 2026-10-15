from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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
def register(payload: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    normalized_email = payload.email.lower().strip()
    normalized_username = payload.username.strip()

    existing_user_by_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()

    if existing_user_by_email:
        if existing_user_by_email.is_verified:
            raise HTTPException(400, "Email already registered")

        # User previously attempted registration but was not verified.
        # Allow updating details and re-requesting verification.
        username_taken = db.query(User).filter(
            func.lower(User.username) == func.lower(normalized_username),
            User.id != existing_user_by_email.id
        ).first()
        if username_taken:
            raise HTTPException(400, "Username already taken")

        user = existing_user_by_email
        user.name = payload.name.strip()
        user.username = normalized_username
        user.password_hash = hash_password(payload.password)
    else:
        if db.query(User).filter(func.lower(User.username) == func.lower(normalized_username)).first():
            raise HTTPException(400, "Username already taken")

        user = User(
            email=normalized_email,
            name=payload.name.strip(),
            username=normalized_username,
            password_hash=hash_password(payload.password),
            is_verified=False
        )
        db.add(user)

    otp = generate_otp()
    try:
        store_otp(user.email, otp)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to initialize registration verification")

    background_tasks.add_task(send_otp_email, payload.email, otp)
    return user

@router.post("/verify-otp")
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == func.lower(payload.email.strip())).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_and_consume_otp(user.email, payload.otp.strip(), max_attempts=MAX_OTP_ATTEMPTS, consume=True):
        raise HTTPException(400, "Invalid, expired, or too many incorrect attempts")

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}

class ResendOTPRequest(BaseModel):
    email: EmailStr

@router.post("/resend-otp")
def resend_otp(payload: ResendOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == func.lower(payload.email.strip())).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_verified:
        raise HTTPException(400, "Email already verified")

    otp = generate_otp()
    store_otp(user.email, otp)
    background_tasks.add_task(send_otp_email, user.email, otp)
    return {"message": "A new verification code has been sent"}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(payload.identifier)) | 
        (func.lower(User.username) == func.lower(payload.identifier))
    ).first()
    
    response_msg = "If an account exists for that email or username, a reset code has been sent."
    
    if user:
        otp = generate_otp()
        store_otp(user.email, otp)
        background_tasks.add_task(send_otp_email, user.email, otp)
        
    return {"message": response_msg}

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
    ident = payload.identifier.strip()
    user = db.query(User).filter(
        (func.lower(User.email) == func.lower(ident)) | 
        (func.lower(User.username) == func.lower(ident))
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

