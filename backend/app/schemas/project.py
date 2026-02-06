"""Project schemas for request/response validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re


class ProjectBase(BaseModel):
    """Base schema for project."""

    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=500)
    body: Optional[str] = None
    color_primary: str = Field(min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$")
    color_secondary: str = Field(
        min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$"
    )
    color_background: str = Field(
        min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$"
    )
    avatar_id: Optional[int] = Field(None, description="ID of the avatar to use (NULL = Default)")
    voice: str = Field(min_length=1, max_length=100)
    show_animation: bool = True
    return_link: Optional[str] = Field(None, max_length=500)
    return_link_text: Optional[str] = Field(None, max_length=100)
    is_demo: bool = False
    is_enabled: bool = True

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        if not re.match(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens. "
                "Cannot start or end with a hyphen."
            )
        return v


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""

    customer_id: int = Field(gt=0)
    logo: Optional[str] = Field(None, max_length=500)


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    logo: Optional[str] = Field(None, max_length=500)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=500)
    body: Optional[str] = None
    color_primary: Optional[str] = Field(
        None, min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$"
    )
    color_secondary: Optional[str] = Field(
        None, min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$"
    )
    color_background: Optional[str] = Field(
        None, min_length=7, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$"
    )
    avatar_id: Optional[int] = Field(None, description="ID of the avatar to use")
    voice: Optional[str] = Field(None, min_length=1, max_length=100)
    show_animation: Optional[bool] = None
    return_link: Optional[str] = Field(None, max_length=500)
    return_link_text: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_demo: Optional[bool] = None
    is_enabled: Optional[bool] = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug is URL-safe."""
        if v is not None and not re.match(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens. "
                "Cannot start or end with a hyphen."
            )
        return v


class AvatarInfo(BaseModel):
    """Embedded avatar info for project responses."""
    
    id: int
    uuid: UUID
    name: str
    file_path: str
    thumbnail_url: Optional[str] = None


class ProjectResponse(BaseModel):
    """Schema for project response."""

    id: int
    uuid: UUID
    customer_id: int
    name: str
    slug: str
    title: str
    subtitle: Optional[str]
    body: Optional[str]
    color_primary: str
    color_secondary: str
    color_background: str
    avatar_id: Optional[int]
    avatar: Optional[AvatarInfo] = None
    voice: str
    show_animation: bool
    return_link: Optional[str]
    return_link_text: Optional[str]
    is_demo: bool
    logo: Optional[str]
    is_active: bool
    is_enabled: bool
    is_ready: bool
    created_at: datetime
    updated_at: datetime
    documents_count: Optional[int] = 0
    customer_name: Optional[str] = None
    customer_uuid: Optional[UUID] = None

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Schema for paginated project list."""

    projects: list[ProjectResponse]
    total: int
    page: int
    per_page: int


class PublicProjectResponse(BaseModel):
    """Schema for public project response (no internal IDs)."""

    uuid: UUID
    name: str
    slug: str
    title: str
    subtitle: Optional[str]
    body: Optional[str]
    color_primary: str
    color_secondary: str
    color_background: str
    avatar: Optional[AvatarInfo] = None
    voice: str
    show_animation: bool
    return_link: Optional[str]
    return_link_text: Optional[str]
    logo: Optional[str]
    is_ready: bool = True
    documents_count: Optional[int] = 0
