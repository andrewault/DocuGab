"""Auth schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class UserRegister(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    uuid: UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    theme: str
    timezone: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChange(BaseModel):
    """Schema for changing password."""

    current_password: str
    new_password: str = Field(min_length=8)


class UserSettingsUpdate(BaseModel):
    """Schema for updating user settings."""

    theme: Optional[str] = Field(None, pattern="^(light|dark|system)$")
    timezone: Optional[str] = None
