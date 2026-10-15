import logging
import secrets

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)
RESEND_ENDPOINT = "https://api.resend.com/emails"

def generate_otp() -> str:
    """Generate a cryptographically secure, zero-padded six-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"

def _otp_html(otp: str) -> str:
    return f"""
    <!doctype html>
    <html>
      <body style="margin:0;padding:32px;background:#0d1117;color:#fff;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;padding:32px;border:1px solid #00ffcc;border-radius:12px;background:#161b2e;text-align:center">
          <h1 style="color:#00ffcc;margin-top:0">RETRO CHAT</h1>
          <p>Your email verification code is:</p>
          <div style="margin:28px 0;padding:18px;background:#000;border:2px dashed #ff0055;border-radius:8px;color:#ff0055;font-size:42px;letter-spacing:8px;font-weight:bold">{otp}</div>
          <p>This code expires in 10 minutes. Do not share it with anyone.</p>
          <p style="margin-top:28px;color:#aaa;font-size:12px">Stay Retro. | Retro Chat System</p>
        </div>
      </body>
    </html>
    """

async def send_otp_email(email: str, otp: str):
    """
    Send OTP through Resend's HTTPS API. Do not use direct SMTP by default:
    the deployed Render Free service times out connecting to SMTP port 465.
    Configure RESEND_API_KEY and EMAIL_FROM in the Render environment.
    """
    provider = (settings.email_provider or "resend").strip().lower()
    if provider != "resend":
        raise RuntimeError(
            f"Unsupported EMAIL_PROVIDER '{provider}'. This deployment supports 'resend'."
        )

    api_key = (settings.resend_api_key or "").strip()
    sender = (settings.email_from or "").strip()
    if not api_key:
        logger.error("Resend email provider is not configured: RESEND_API_KEY is missing")
        raise RuntimeError("Email delivery is not configured: missing RESEND_API_KEY")
    if not sender:
        logger.error("Resend email provider is not configured: EMAIL_FROM is missing")
        raise RuntimeError("Email delivery is not configured: missing EMAIL_FROM sender address")

    payload = {
        "from": sender,
        "to": [email],
        "subject": "Your Retro Chat Verification Code",
        "html": _otp_html(otp),
        "text": f"Your Retro Chat verification code is {otp}. It expires in 10 minutes. Do not share it.",
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=5.0),
            follow_redirects=False,
        ) as client:
            response = await client.post(RESEND_ENDPOINT, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        logger.warning("Resend API request timed out while sending OTP (recipient=%s)", email)
        raise RuntimeError("Email provider timed out. Please try again shortly.") from exc
    except httpx.RequestError as exc:
        logger.warning("Could not connect to Resend API while sending OTP (recipient=%s)", email)
        raise RuntimeError("Email provider is temporarily unreachable.") from exc

    if not response.is_success:
        # Do not log the API key, OTP, request body, or provider response body.
        logger.error("Resend rejected OTP email (HTTP %s, recipient=%s)", response.status_code, email)
        raise RuntimeError(
            f"Email provider rejected the request (HTTP {response.status_code}); "
            "check the API key, sending permissions, and verified sender domain."
        )

    try:
        message_id = response.json().get("id")
    except ValueError:
        message_id = None
    logger.info("OTP email accepted by Resend (recipient=%s, message_id=%s)",
                email, message_id or "unavailable")
