import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # Use an HTTPS email API by default; Render Free blocks outbound SMTP ports.
    email_provider: str = "resend"
    resend_api_key: str | None = None
    email_from: str | None = None

    # Legacy SMTP fields remain optional for local compatibility; Resend is the
    # production provider selected by EMAIL_PROVIDER=resend.
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_username: str | None = None
    smtp_password: str | None = None

    frontend_origin: str = "http://localhost:5173"
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    r2_public_url: str | None = None
    redis_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), ".env"],
        extra="ignore",
    )

settings = Settings()
