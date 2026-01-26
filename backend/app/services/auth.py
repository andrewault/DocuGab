"""Auth service for registration, login, and token management."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import User
from app.models.session import Session
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.auth import UserRegister


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email address."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    """Create a new user account."""
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    """Authenticate a user with email and password."""
    user = await get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


async def create_session(
    db: AsyncSession,
    user_id: int,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> tuple[str, str]:
    """Create access and refresh tokens, store refresh token in session."""
    access_token = create_access_token(user_id)
    refresh_token, expires_at = create_refresh_token(user_id)
    
    session = Session(
        user_id=user_id,
        refresh_token=refresh_token,
        device_info=device_info,
        ip_address=ip_address,
        expires_at=expires_at,
    )
    db.add(session)
    await db.commit()
    
    return access_token, refresh_token


async def refresh_access_token(
    db: AsyncSession, refresh_token: str
) -> Optional[tuple[str, str]]:
    """Refresh the access token using a refresh token."""
    # Decode and validate refresh token
    payload = decode_token(refresh_token)
    if payload is None:
        return None
    if payload.get("type") != "refresh":
        return None
    
    # Check if session exists and is valid
    result = await db.execute(
        select(Session).where(Session.refresh_token == refresh_token)
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        return None
    
    # Handle naive/aware datetimes (SQLite stored as naive)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        # Clean up expired session
        await db.delete(session)
        await db.commit()
        return None
    
    # Create new tokens
    user_id = session.user_id
    access_token = create_access_token(user_id)
    new_refresh_token, expires_at = create_refresh_token(user_id)
    
    # Update session with new refresh token
    session.refresh_token = new_refresh_token
    session.expires_at = expires_at
    await db.commit()
    
    return access_token, new_refresh_token


async def invalidate_session(db: AsyncSession, refresh_token: str) -> bool:
    """Invalidate a session by deleting it."""
    result = await db.execute(
        select(Session).where(Session.refresh_token == refresh_token)
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        return False
    
    await db.delete(session)
    await db.commit()
    return True


async def invalidate_all_sessions(db: AsyncSession, user_id: int) -> int:
    """Invalidate all sessions for a user. Returns count of deleted sessions."""
    result = await db.execute(
        delete(Session).where(Session.user_id == user_id)
    )
    await db.commit()
    return result.rowcount  # type: ignore


async def update_last_login(db: AsyncSession, user: User) -> None:
    """Update the user's last login timestamp."""
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
