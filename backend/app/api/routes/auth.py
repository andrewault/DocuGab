"""Auth API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    UserResponse,
)
from app.services import auth as auth_service


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Check if email already exists
    existing = await auth_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = await auth_service.create_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login and receive access and refresh tokens."""
    user = await auth_service.authenticate_user(db, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Get client info
    device_info = request.headers.get("User-Agent", "")[:255]
    ip_address = request.client.host if request.client else None

    # Create session and tokens
    access_token, refresh_token = await auth_service.create_session(
        db, user.id, device_info, ip_address
    )

    # Update last login
    await auth_service.update_last_login(db, user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    result = await auth_service.refresh_access_token(db, data.refresh_token)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token, new_refresh_token = result
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    """Logout by invalidating the refresh token."""
    await auth_service.invalidate_session(db, data.refresh_token)
    return None


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout from all devices by invalidating all sessions."""
    await auth_service.invalidate_all_sessions(db, current_user.id)
    return None


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's information."""
    # Populate customer data
    user_dict = UserResponse.model_validate(current_user).model_dump()
    if current_user.customer_id:
        customer_result = await db.execute(
            select(Customer).where(Customer.id == current_user.customer_id)
        )
        customer = customer_result.scalar_one_or_none()
        if customer:
            user_dict["customer_uuid"] = customer.uuid
            user_dict["customer_name"] = customer.name
    
    return UserResponse(**user_dict)
