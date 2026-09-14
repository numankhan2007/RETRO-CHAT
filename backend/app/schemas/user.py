from pydantic import BaseModel, EmailStr, Field, field_validator
import re

def validate_password(v: str) -> str:
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", v):
        raise ValueError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
    return v

class UserRegister(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9._]+$")
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @field_validator('password')
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password(v)

class UserLogin(BaseModel):
    identifier: str
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)

class ForgotPasswordRequest(BaseModel):
    identifier: str

class VerifyResetOtpRequest(BaseModel):
    identifier: str
    otp: str = Field(min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @field_validator('new_password')
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password(v)

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    username: str | None = Field(default=None, min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9._]+$")
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=255)

class AvatarUploadRequest(BaseModel):
    content_type: str = Field(default="image/webp")

class AvatarCompleteRequest(BaseModel):
    object_key: str

class UserOut(BaseModel):
    id: int
    name: str
    username: str
    bio: str | None = None
    avatar_url: str | None = None
    accent_color: str
    font_choice: str
    wallpaper_id: str

    class Config:
        from_attributes = True
