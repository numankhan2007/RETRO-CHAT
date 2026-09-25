from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    frontend_origin: str = "http://localhost:5173"
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    r2_public_url: str | None = None
    redis_url: str

    class Config:
        env_file = ".env"

settings = Settings()
