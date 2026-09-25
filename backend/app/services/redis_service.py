import redis
from app.core.config import settings
from datetime import timedelta
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

# Initialize Redis connection if URL is provided
redis_client = None
if settings.redis_url:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def handle_redis_error(e):
    logger.error(f"Redis error: {e}")
    raise HTTPException(status_code=503, detail="Service temporarily unavailable, please try again shortly")

def store_otp(email: str, otp: str, expires_in_minutes: int = 10):
    if not redis_client:
        return
    try:
        redis_client.setex(f"otp:{email}", timedelta(minutes=expires_in_minutes), otp)
        redis_client.setex(f"otp_attempts:{email}", timedelta(minutes=expires_in_minutes), 0)
    except redis.exceptions.RedisError as e:
        handle_redis_error(e)

def verify_and_consume_otp(email: str, submitted_otp: str, max_attempts: int = 5, consume: bool = True) -> bool:
    if not redis_client:
        return False
    
    try:
        # Check attempts
        attempts = redis_client.get(f"otp_attempts:{email}")
        if attempts and int(attempts) >= max_attempts:
            return False
        
        # Check OTP
        stored_otp = redis_client.get(f"otp:{email}")
        if not stored_otp:
            return False
            
        if stored_otp != submitted_otp:
            # Increment attempts
            redis_client.incr(f"otp_attempts:{email}")
            return False
            
        # OTP is valid, consume it if requested
        if consume:
            redis_client.delete(f"otp:{email}")
            redis_client.delete(f"otp_attempts:{email}")
        return True
    except redis.exceptions.RedisError as e:
        handle_redis_error(e)

def clear_otp(email: str):
    if not redis_client:
        return
    try:
        redis_client.delete(f"otp:{email}")
        redis_client.delete(f"otp_attempts:{email}")
    except redis.exceptions.RedisError as e:
        handle_redis_error(e)
