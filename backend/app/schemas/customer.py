"""Customer schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class CustomerBase(BaseModel):
    """Base schema for customer."""

    name: str = Field(min_length=1, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)


class CustomerCreate(CustomerBase):
    """Schema for creating a customer."""

    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    """Schema for customer response."""

    id: int
    uuid: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    projects_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    """Schema for paginated customer list."""

    customers: list[CustomerResponse]
    total: int
    page: int
    per_page: int
