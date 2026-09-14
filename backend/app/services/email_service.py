import random
from datetime import datetime, timezone
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.smtp_username,
    MAIL_PASSWORD=settings.smtp_password,
    MAIL_FROM=settings.smtp_username,
    MAIL_PORT=settings.smtp_port,
    MAIL_SERVER=settings.smtp_host,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"

async def send_otp_email(email: str, otp: str):
    message = MessageSchema(
        subject="Your Retro Chat verification code",
        recipients=[email],
        body=f"Your verification code is: {otp}\nThis code expires in 10 minutes.",
        subtype=MessageType.plain,
    )
    await FastMail(conf).send_message(message)

def otp_is_valid(stored_otp: str | None, stored_expiry: datetime | None, submitted_otp: str) -> bool:
    if not stored_otp or not stored_expiry:
        return False
    if stored_otp != submitted_otp:
        return False
        
    # Ensure we are comparing aware with aware or naive with naive
    now = datetime.utcnow()
    if stored_expiry.tzinfo is not None:
        now = datetime.now(timezone.utc)
        
    if now > stored_expiry:
        return False
    return True
