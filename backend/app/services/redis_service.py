import time
from threading import Lock
import redis
from app.core.config import settings
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# Initialize Redis connection if URL is provided
redis_client = None
if settings.redis_url:
    try:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    except Exception as e:
        logger.warning(f"Could not initialize Redis client: {e}")

# In-memory fallback for local development or Redis downtime
_local_lock = Lock()
_local_otps: dict[str, dict] = {}  # email -> {"otp": str, "expires_at": float, "attempts": int}

def store_otp(email: str, otp: str, expires_in_minutes: int = 10):
    normalized_email = email.lower().strip()
    if redis_client:
        try:
            redis_client.setex(f"otp:{normalized_email}", timedelta(minutes=expires_in_minutes), otp)
            redis_client.setex(f"otp_attempts:{normalized_email}", timedelta(minutes=expires_in_minutes), 0)
            return
        except redis.exceptions.RedisError as e:
            logger.warning(f"Redis error in store_otp, falling back to local memory: {e}")

    # Fallback to in-memory store
    with _local_lock:
        _local_otps[normalized_email] = {
            "otp": otp,
            "expires_at": time.time() + (expires_in_minutes * 60),
            "attempts": 0,
        }

def verify_and_consume_otp(email: str, submitted_otp: str, max_attempts: int = 5, consume: bool = True) -> bool:
    normalized_email = email.lower().strip()

    # 1. Try Redis first if available
    if redis_client:
        try:
            attempts = redis_client.get(f"otp_attempts:{normalized_email}")
            if attempts and int(attempts) >= max_attempts:
                return False

            stored_otp = redis_client.get(f"otp:{normalized_email}")
            if stored_otp:
                if stored_otp != submitted_otp:
                    redis_client.incr(f"otp_attempts:{normalized_email}")
                    return False

                if consume:
                    redis_client.delete(f"otp:{normalized_email}")
                    redis_client.delete(f"otp_attempts:{normalized_email}")
                return True
        except redis.exceptions.RedisError as e:
            logger.warning(f"Redis error in verify_and_consume_otp, checking local memory: {e}")

    # 2. Check local in-memory fallback
    with _local_lock:
        record = _local_otps.get(normalized_email)
        if not record:
            return False

        if time.time() > record["expires_at"]:
            _local_otps.pop(normalized_email, None)
            return False

        if record["attempts"] >= max_attempts:
            return False

        if record["otp"] != submitted_otp:
            record["attempts"] += 1
            return False

        if consume:
            _local_otps.pop(normalized_email, None)
        return True

def clear_otp(email: str):
    normalized_email = email.lower().strip()
    if redis_client:
        try:
            redis_client.delete(f"otp:{normalized_email}")
            redis_client.delete(f"otp_attempts:{normalized_email}")
        except redis.exceptions.RedisError:
            pass

    with _local_lock:
        _local_otps.pop(normalized_email, None)

