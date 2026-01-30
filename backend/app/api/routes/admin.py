"""Admin API routes for user management."""

from typing import Optional, Any
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.document import Document
from app.models.customer import Customer
from app.models.project import Project
from app.schemas.auth import UserResponse


router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserUpdate(BaseModel):
    """Schema for admin updating a user."""

    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserListResponse(BaseModel):
    """Schema for paginated user list."""

    users: list[UserResponse]
    total: int
    page: int
    per_page: int


class AdminStats(BaseModel):
    """Schema for admin dashboard stats."""

    total_users: int
    total_customers: int
    total_projects: int
    total_documents: int


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get admin dashboard statistics."""
    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # Total customers
    customers_result = await db.execute(select(func.count(Customer.id)))
    total_customers = customers_result.scalar() or 0

    # Total projects
    projects_result = await db.execute(select(func.count(Project.id)))
    total_projects = projects_result.scalar() or 0

    # Total documents
    docs_result = await db.execute(select(func.count(Document.id)))
    total_documents = docs_result.scalar() or 0

    return AdminStats(
        total_users=total_users,
        total_customers=total_customers,
        total_projects=total_projects,
        total_documents=total_documents,
    )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and filtering."""
    # Build query
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply filters
    filters: list[Any] = []
    if search:
        search_filter = User.email.ilike(f"%{search}%") | User.full_name.ilike(
            f"%{search}%"
        )
        filters.append(search_filter)
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.order_by(User.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/users/{user_uuid}", response_model=UserResponse)
async def get_user(
    user_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by UUID."""
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.patch("/users/{user_uuid}", response_model=UserResponse)
async def update_user(
    user_uuid: UUID,
    data: AdminUserUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user (admin only)."""
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent demoting superadmin unless you are superadmin
    if user.role == "superadmin" and admin.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify superadmin",
        )

    # Update fields
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None:
        if data.role not in ["user", "admin", "superadmin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            )
        # Only superadmin can assign superadmin role
        if data.role == "superadmin" and admin.role != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only superadmin can assign superadmin role",
            )
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_verified is not None:
        user.is_verified = data.is_verified

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user (admin only)."""
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent deleting superadmin
    if user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete superadmin",
        )

    # Prevent self-deletion through this endpoint
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself through admin endpoint",
        )

    await db.delete(user)
    await db.commit()
    return None
