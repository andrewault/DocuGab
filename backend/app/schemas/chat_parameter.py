"""Schemas for ChatParameter."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ChatParameterBase(BaseModel):
    """Base schema for ChatParameter."""

    name: str = Field(..., min_length=1, max_length=100)
    system_prompt: str = Field(..., min_length=1)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class ChatParameterCreate(ChatParameterBase):
    """Schema for creating a ChatParameter."""

    pass


class ChatParameterUpdate(BaseModel):
    """Schema for updating a ChatParameter."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    system_prompt: Optional[str] = Field(None, min_length=1)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)


class ChatParameterResponse(ChatParameterBase):
    """Schema for ChatParameter response."""

    id: int
    uuid: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ChatParameterListResponse(BaseModel):
    """Schema for list of ChatParameters."""

    parameters: list[ChatParameterResponse]
    total: int
