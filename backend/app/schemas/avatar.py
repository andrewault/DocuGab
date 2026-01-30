"""Avatar schemas for API requests and responses."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AvatarBase(BaseModel):
    """Base avatar schema."""

    project_id: int = Field(..., description="ID of the project this avatar belongs to")


class AvatarCreate(AvatarBase):
    """Schema for creating a new avatar."""

    pass


class AvatarResponse(AvatarBase):
    """Schema for avatar response."""

    id: int
    uuid: UUID
    filename: str
    original_filename: str
    file_size: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class AvatarListResponse(BaseModel):
    """Schema for list of avatars."""

    avatars: list[AvatarResponse]
    total: int
