import logging
import secrets

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)

# Port 465 uses implicit TLS; port 587 uses STARTTLS.
smtp_port = settings.smtp_port
conf = ConnectionConfig(
    MAIL_USERNAME=settings.smtp_username,
    MAIL_PASSWORD=settings.smtp_password,
    MAIL_FROM=settings.smtp_username,
    MAIL_PORT=smtp_port,
    MAIL_SERVER=settings.smtp_host,
    MAIL_STARTTLS=(smtp_port == 587),
    MAIL_SSL_TLS=(smtp_port == 465),
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

def generate_otp() -> str:
    """Generate a zero-padded, cryptographically secure six-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"

async def send_otp_email(email: str, otp: str):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ background-color: #0d1117; color: #ffffff; font-family: 'Courier New', Courier, monospace; padding: 40px; text-align: center; }}
            .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; border-radius: 12px; border: 1px solid #00ffcc; }}
            .logo {{ font-size: 32px; font-weight: bold; color: #00ffcc; margin-bottom: 20px; }}
            .otp-box {{ background: #000; border: 2px dashed #ff0055; padding: 20px; font-size: 48px; letter-spacing: 10px; font-weight: bold; color: #ff0055; margin: 30px 0; border-radius: 8px; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #888; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">RETRO CHAT</div>
            <p>Your email verification code is:</p>
            <div class="otp-box">{otp}</div>
            <p>This code expires in 10 minutes. Do not share it with anyone.</p>
            <div class="footer">Stay Retro. | Retro Chat System</div>
        </div>
    </body>
    </html>
    """
    message = MessageSchema(
        subject="Your Retro Chat Verification Code",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html,
    )
    try:
        await FastMail(conf).send_message(message)
    except Exception:
        # Never log credentials, OTPs, or message bodies.
        logger.exception("OTP email delivery failed (recipient=%s, host=%s, port=%s)",
                         email, settings.smtp_host, settings.smtp_port)
        raise
