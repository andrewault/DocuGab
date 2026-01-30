"""User profile API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdate, PasswordChange, UserSettingsUpdate


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = hash_password(data.new_password)
    await db.commit()
    return None


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete current user's account."""
    await db.delete(current_user)
    await db.commit()
    return None


@router.get("/me/settings", response_model=UserResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
):
    """Get current user's settings (theme and timezone)."""
    return current_user


@router.patch("/me/settings", response_model=UserResponse)
async def update_settings(
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's settings (theme and timezone)."""
    if data.theme is not None:
        current_user.theme = data.theme
    if data.timezone is not None:
        # TODO: Add timezone validation using pytz
        current_user.timezone = data.timezone

    await db.commit()
    await db.refresh(current_user)
    return current_user
