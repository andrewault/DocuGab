"""Avatar schemas for API requests and responses."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AvatarBase(BaseModel):
    """Base avatar schema."""

    name: str = Field(..., min_length=1, max_length=255, description="Avatar display name")


class AvatarCreate(AvatarBase):
    """Schema for creating a new avatar (file uploaded separately)."""

    pass


class AvatarResponse(BaseModel):
    """Schema for avatar response."""

    id: int
    uuid: UUID
    name: str
    customer_id: int | None
    file_path: str
    file_extension: str
    file_size: int
    original_filename: str
    thumbnail_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class AvatarListResponse(BaseModel):
    """Schema for list of avatars."""

    avatars: list[AvatarResponse]
    total: int
