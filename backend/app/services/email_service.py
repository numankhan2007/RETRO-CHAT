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
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                background-color: #0d1117;
                color: #ffffff;
                font-family: 'Courier New', Courier, monospace;
                padding: 40px;
                text-align: center;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                padding: 40px;
                border-radius: 12px;
                border: 1px solid #00ffcc;
                box-shadow: 0 0 20px rgba(0, 255, 204, 0.2);
            }}
            .logo {{
                font-size: 32px;
                font-weight: bold;
                color: #00ffcc;
                text-shadow: 0 0 10px #00ffcc;
                margin-bottom: 20px;
            }}
            .otp-box {{
                background: #000;
                border: 2px dashed #ff0055;
                padding: 20px;
                font-size: 48px;
                letter-spacing: 10px;
                font-weight: bold;
                color: #ff0055;
                margin: 30px 0;
                border-radius: 8px;
                text-shadow: 0 0 15px #ff0055;
            }}
            .footer {{
                margin-top: 30px;
                font-size: 12px;
                color: #888;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">RETRO CHAT</div>
            <p>Connection initialized. Your verification override code is below:</p>
            <div class="otp-box">{otp}</div>
            <p>This code will self-destruct in 10 minutes.</p>
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
    await FastMail(conf).send_message(message)


