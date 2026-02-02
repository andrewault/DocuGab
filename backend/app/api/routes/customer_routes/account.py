"""Customer account management API routes (customer-facing)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from pydantic import BaseModel, EmailStr


# Schemas
class UserAccountResponse(BaseModel):
    """Customer user response for account page."""

    id: int
    uuid: UUID
    email: str
    full_name: str | None
    avatar_url: str | None
    role: str
    is_active: bool
    is_verified: bool
    created_at: str
    last_login_at: str | None
    customer_role: str | None = None  # owner, admin, member


class CustomerAccountResponse(BaseModel):
    """Customer account information response."""

    id: int
    uuid: UUID
    name: str
    email: str | None
    contact_name: str | None
    contact_phone: str | None
    is_active: bool
    is_docutok_customer: bool
    created_at: str
    updated_at: str


class AccountInfoResponse(BaseModel):
    """Complete account information including customer and users."""

    customer: CustomerAccountResponse
    users: list[UserAccountResponse]
    current_user_role: str  # owner, admin, member


class InviteUserRequest(BaseModel):
    """Request to invite a new user to the customer account."""

    email: EmailStr
    full_name: str
    customer_role: str = "member"  # owner, admin, member


class UpdateUserRoleRequest(BaseModel):
    """Request to update a user's role within the customer account."""

    customer_role: str  # owner, admin, member


class UpdateUserInfoRequest(BaseModel):
    """Request to update a user's information."""

    full_name: str | None = None


router = APIRouter(tags=["customer", "account"])


def get_user_customer_role(user: User) -> str:
    """Determine user's role within their customer account.

    Returns the customer_role from the database, with fallback logic:
    - If customer_role is set, use it
    - If user is admin, treat as owner
    - Otherwise default to member
    """
    if user.customer_role:
        return user.customer_role

    if user.role == "admin":
        return "owner"  # Admins are treated as owners

    return "member"


@router.get("", response_model=AccountInfoResponse)
async def get_account_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get customer account information and list of users."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Get customer
    result = await db.execute(select(Customer).where(Customer.id == user.customer_id))
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # Get all users for this customer
    result = await db.execute(
        select(User)
        .where(User.customer_id == user.customer_id)
        .order_by(User.created_at)
    )
    users = list(result.scalars().all())

    # Build user responses with customer roles
    user_responses = []
    for u in users:
        user_role = get_user_customer_role(u)
        user_responses.append(
            UserAccountResponse(
                id=u.id,
                uuid=u.uuid,
                email=u.email,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                role=u.role,
                is_active=u.is_active,
                is_verified=u.is_verified,
                created_at=u.created_at.isoformat(),
                last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
                customer_role=user_role,
            )
        )

    # Build customer response
    customer_response = CustomerAccountResponse(
        id=customer.id,
        uuid=customer.uuid,
        name=customer.name,
        email=customer.email,
        contact_name=customer.contact_name,
        contact_phone=customer.contact_phone,
        is_active=customer.is_active,
        is_docutok_customer=customer.is_docutok_customer,
        created_at=customer.created_at.isoformat(),
        updated_at=customer.updated_at.isoformat(),
    )

    return AccountInfoResponse(
        customer=customer_response,
        users=user_responses,
        current_user_role=get_user_customer_role(user),
    )


@router.post("/invite")
async def invite_user(
    request: InviteUserRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a new user to the customer account.

    Note: For security, only owners and admins can invite users.
    TODO: Implement email verification flow.
    """
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Check if current user has permission to invite
    current_user_role = get_user_customer_role(user)
    if current_user_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only account owners and admins can invite users",
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create temporary password (should be sent via email in production)
    from app.core.security import get_password_hash

    temp_password = "ChangeMe123!"  # TODO: Generate random password and send via email

    # Create new user
    new_user = User(
        email=request.email,
        full_name=request.full_name,
        password_hash=get_password_hash(temp_password),
        role="customer",
        customer_id=user.customer_id,
        is_active=True,
        is_verified=False,  # Require email verification
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "message": "User invited successfully",
        "user": {
            "uuid": new_user.uuid,
            "email": new_user.email,
            "full_name": new_user.full_name,
        },
        "temp_password": temp_password,  # TODO: Remove this and send via email
    }


@router.patch("/users/{user_uuid}")
async def update_user_info(
    user_uuid: UUID,
    request: UpdateUserInfoRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's information (full_name, etc.).

    Users can update their own information, or owners/admins can update others.
    """
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Get target user
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify target user belongs to same customer
    if target_user.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users from other customer accounts",
        )

    # Check permission - users can edit themselves, or owners/admins can edit anyone
    current_user_role = get_user_customer_role(user)
    if target_user.id != user.id and current_user_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own information",
        )

    # Update full_name if provided
    if request.full_name is not None:
        target_user.full_name = request.full_name

    await db.commit()
    await db.refresh(target_user)

    return {
        "message": "User information updated successfully",
        "user": {
            "uuid": target_user.uuid,
            "email": target_user.email,
            "full_name": target_user.full_name,
        },
    }


@router.patch("/users/{user_uuid}/role")
async def update_user_role(
    user_uuid: UUID,
    request: UpdateUserRoleRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role within the customer account.

    Only owners can change roles.
    """
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Check permission - only owners can change roles
    current_user_role = get_user_customer_role(user)
    if current_user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only account owners can change user roles",
        )

    # Validate role value
    if request.customer_role not in ["owner", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'owner' or 'member'",
        )

    # Get target user
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify target user belongs to same customer
    if target_user.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users from other customer accounts",
        )

    # Update the role
    target_user.customer_role = request.customer_role
    await db.commit()
    await db.refresh(target_user)

    return {
        "message": "User role updated successfully",
        "user": {
            "uuid": target_user.uuid,
            "email": target_user.email,
            "customer_role": target_user.customer_role,
        },
    }


@router.patch("/users/{user_uuid}/deactivate")
async def deactivate_user(
    user_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user in the customer account.

    Only owners and admins can deactivate users.
    Users cannot deactivate themselves.
    """
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Check permission
    current_user_role = get_user_customer_role(user)
    if current_user_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only account owners and admins can deactivate users",
        )

    # Get target user
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify target user belongs to same customer
    if target_user.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users from other customer accounts",
        )

    # Prevent self-deactivation
    if target_user.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Deactivate user
    target_user.is_active = False
    await db.commit()

    return {
        "message": "User deactivated successfully",
        "user": {
            "uuid": target_user.uuid,
            "email": target_user.email,
            "is_active": target_user.is_active,
        },
    }


@router.patch("/users/{user_uuid}/reactivate")
async def reactivate_user(
    user_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a previously deactivated user.

    Only owners and admins can reactivate users.
    """
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Check permission
    current_user_role = get_user_customer_role(user)
    if current_user_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only account owners and admins can reactivate users",
        )

    # Get target user
    result = await db.execute(select(User).where(User.uuid == user_uuid))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify target user belongs to same customer
    if target_user.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users from other customer accounts",
        )

    # Reactivate user
    target_user.is_active = True
    await db.commit()

    return {
        "message": "User reactivated successfully",
        "user": {
            "uuid": target_user.uuid,
            "email": target_user.email,
            "is_active": target_user.is_active,
        },
    }
