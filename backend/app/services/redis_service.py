import logging

import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# OTPs must use shared Redis: process-local fallback is unsafe with multiple workers.
redis_client = redis.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None

_STORE_SCRIPT = """
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
redis.call('SET', KEYS[2], '0', 'EX', ARGV[2])
return 1
"""

_VERIFY_SCRIPT = """
local otp = redis.call('GET', KEYS[1])
if not otp then return 0 end
local attempts = tonumber(redis.call('GET', KEYS[2]) or '0')
local max_attempts = tonumber(ARGV[2])
if attempts >= max_attempts then return 0 end
if otp ~= ARGV[1] then
  local count = redis.call('INCR', KEYS[2])
  if count == 1 then
    local ttl = redis.call('TTL', KEYS[1])
    if ttl > 0 then redis.call('EXPIRE', KEYS[2], ttl) end
  end
  return 0
end
if ARGV[3] == '1' then redis.call('DEL', KEYS[1], KEYS[2]) end
return 1
"""

def _client():
    if redis_client is None:
        raise RuntimeError("REDIS_URL is required for OTP storage; configure shared Redis.")
    return redis_client

def store_otp(email: str, otp: str, expires_in_minutes: int = 10):
    normalized_email = email.lower().strip()
    try:
        _client().eval(
            _STORE_SCRIPT, 2,
            f"otp:{normalized_email}", f"otp_attempts:{normalized_email}",
            otp, expires_in_minutes * 60,
        )
    except redis.exceptions.RedisError as exc:
        logger.exception("Unable to store OTP in Redis")
        raise RuntimeError("OTP storage is temporarily unavailable") from exc

def verify_and_consume_otp(email: str, submitted_otp: str, max_attempts: int = 5, consume: bool = True) -> bool:
    normalized_email = email.lower().strip()
    try:
        result = _client().eval(
            _VERIFY_SCRIPT, 2,
            f"otp:{normalized_email}", f"otp_attempts:{normalized_email}",
            submitted_otp, max_attempts, "1" if consume else "0",
        )
        return bool(result)
    except redis.exceptions.RedisError as exc:
        logger.exception("Unable to verify OTP in Redis")
        raise RuntimeError("OTP verification is temporarily unavailable") from exc

def clear_otp(email: str):
    normalized_email = email.lower().strip()
    if redis_client is None:
        return
    try:
        redis_client.delete(f"otp:{normalized_email}", f"otp_attempts:{normalized_email}")
    except redis.exceptions.RedisError:
        logger.exception("Unable to clear OTP from Redis")
