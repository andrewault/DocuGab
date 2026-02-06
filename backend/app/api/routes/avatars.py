"""Avatar management API routes (admin and customer)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models.user import User
from app.models.avatar import Avatar
from app.services.storage import (
    save_avatar_file, 
    get_avatar_path, 
    get_avatar_url,
    delete_avatar_file,
    validate_avatar_file,
)
from app.schemas.avatar import AvatarResponse, AvatarListResponse, AvatarCreate


router = APIRouter(tags=["admin", "avatars"])
customer_router = APIRouter(tags=["customer", "avatars"])


async def _build_avatar_response(avatar: Avatar) -> dict:
    """Helper to build avatar response."""
    return {
        "id": avatar.id,
        "uuid": avatar.uuid,
        "name": avatar.name,
        "customer_id": avatar.customer_id,
        "file_path": avatar.file_path,
        "file_extension": avatar.file_extension,
        "file_size": avatar.file_size,
        "original_filename": avatar.original_filename,
        "thumbnail_url": avatar.thumbnail_url,
        "is_active": avatar.is_active,
        "created_at": avatar.created_at,
        "updated_at": avatar.updated_at,
    }


# ============== Admin Endpoints ==============

@router.post(
    "/upload",
    response_model=AvatarResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_avatar_admin(
    name: str,
    file: UploadFile = File(...),
    customer_id: int | None = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new avatar (admin only).
    
    If customer_id is None and name is "Default", creates the global Default avatar.
    """
    # Validate file extension before reading
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )
    
    # Check if trying to create Default avatar
    if name == "Default":
        # Check if Default already exists
        existing = await db.execute(
            select(Avatar).where(Avatar.name == "Default")
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Default avatar already exists",
            )
        customer_id = None  # Default is always global
    
    # Read file content to check size
    content = await file.read()
    file_size = len(content)
    
    # Validate
    is_valid, error = validate_avatar_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create avatar record first to get UUID
    import uuid as uuid_lib
    avatar_uuid = uuid_lib.uuid4()
    
    # Save file
    file_path, file_extension, file_size = await save_avatar_file(file, str(avatar_uuid))
    
    # Create avatar record
    avatar = Avatar(
        uuid=avatar_uuid,
        name=name,
        customer_id=customer_id,
        file_path=file_path,
        file_extension=file_extension,
        file_size=file_size,
        original_filename=file.filename,
        is_active=True,
    )

    db.add(avatar)
    await db.commit()
    await db.refresh(avatar)

    avatar_dict = await _build_avatar_response(avatar)
    return AvatarResponse(**avatar_dict)


@router.get("/", response_model=AvatarListResponse)
async def list_avatars_admin(
    customer_id: int | None = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all avatars (admin only).
    
    Optionally filter by customer_id. Always includes global avatars (customer_id=NULL).
    """
    if customer_id is not None:
        # Get customer avatars + global avatars
        query = (
            select(Avatar)
            .where(or_(Avatar.customer_id == customer_id, Avatar.customer_id.is_(None)))
            .order_by(Avatar.name)
        )
    else:
        # Get all avatars
        query = select(Avatar).order_by(Avatar.name)
    
    result = await db.execute(query)
    avatars = list(result.scalars().all())

    avatar_responses = [
        AvatarResponse(**await _build_avatar_response(avatar)) for avatar in avatars
    ]
    return AvatarListResponse(avatars=avatar_responses, total=len(avatars))


@router.get("/{avatar_uuid}", response_model=AvatarResponse)
async def get_avatar_admin(
    avatar_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific avatar (admin only)."""
    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )

    avatar_dict = await _build_avatar_response(avatar)
    return AvatarResponse(**avatar_dict)


@router.delete("/{avatar_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar_admin(
    avatar_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an avatar (admin only). Cannot delete the Default avatar."""
    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )
    
    # Prevent deletion of Default avatar
    if avatar.name == "Default":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the Default avatar",
        )

    # Delete physical file
    await delete_avatar_file(avatar.file_path)

    # Delete from database
    await db.delete(avatar)
    await db.commit()

    return None


# ============== Customer Endpoints ==============

@customer_router.post(
    "/upload",
    response_model=AvatarResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_avatar_customer(
    name: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new avatar (customer only, scoped to their customer)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Cannot create "Default" avatar as customer
    if name == "Default":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create avatar with name 'Default'",
        )

    # Validate file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    # Read file content to check size
    content = await file.read()
    file_size = len(content)

    # Validate
    is_valid, error = validate_avatar_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Reset file pointer
    await file.seek(0)

    # Create avatar record first to get UUID
    import uuid as uuid_lib
    avatar_uuid = uuid_lib.uuid4()

    # Save file
    file_path, file_extension, file_size = await save_avatar_file(file, str(avatar_uuid))

    # Create avatar record (scoped to customer)
    avatar = Avatar(
        uuid=avatar_uuid,
        name=name,
        customer_id=user.customer_id,
        file_path=file_path,
        file_extension=file_extension,
        file_size=file_size,
        original_filename=file.filename,
        is_active=True,
    )

    db.add(avatar)
    await db.commit()
    await db.refresh(avatar)

    avatar_dict = await _build_avatar_response(avatar)
    return AvatarResponse(**avatar_dict)


@customer_router.get("/", response_model=AvatarListResponse)
async def list_avatars_customer(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List avatars available to the customer (their own + global)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Get customer avatars + global avatars
    query = (
        select(Avatar)
        .where(or_(Avatar.customer_id == user.customer_id, Avatar.customer_id.is_(None)))
        .order_by(Avatar.name)
    )
    result = await db.execute(query)
    avatars = list(result.scalars().all())

    avatar_responses = [
        AvatarResponse(**await _build_avatar_response(avatar)) for avatar in avatars
    ]
    return AvatarListResponse(avatars=avatar_responses, total=len(avatars))


@customer_router.delete("/{avatar_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar_customer(
    avatar_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an avatar (customer only, must own it)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )

    # Cannot delete global avatars
    if avatar.customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete global avatars",
        )

    # Must own the avatar
    if avatar.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Delete physical file
    await delete_avatar_file(avatar.file_path)

    # Delete from database
    await db.delete(avatar)
    await db.commit()

    return None


# ============== Public Endpoints ==============

@router.get("/file/{file_path:path}")
async def get_avatar_file(file_path: str):
    """Serve avatar file (local storage only)."""
    from app.core.config import settings
    
    if settings.storage_backend == "s3":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use S3 presigned URLs for S3 storage",
        )
    
    local_path = get_avatar_path(file_path)
    if not local_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar file not found"
        )
    
    return FileResponse(
        local_path,
        media_type="model/gltf-binary",
        filename=file_path,
    )
