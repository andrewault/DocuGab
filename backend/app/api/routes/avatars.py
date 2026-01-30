"""Avatar management API routes (admin and customer)."""

from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.avatar import Avatar
from app.services.storage import save_avatar_file, get_avatar_path
from app.schemas.avatar import AvatarResponse, AvatarListResponse


router = APIRouter(prefix="/admin/avatars", tags=["admin", "avatars"])
customer_router = APIRouter(prefix="/customer/avatars", tags=["customer", "avatars"])

# File size limit: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024


async def _build_avatar_response(avatar: Avatar) -> dict:
    """Helper to build avatar response."""
    return {
        "id": avatar.id,
        "uuid": avatar.uuid,
        "project_id": avatar.project_id,
        "filename": avatar.filename,
        "original_filename": avatar.original_filename,
        "file_size": avatar.file_size,
        "is_active": avatar.is_active,
        "created_at": avatar.created_at,
        "updated_at": avatar.updated_at,
    }


# Admin endpoints
@router.post("/projects/{project_uuid}/upload", response_model=AvatarResponse, status_code=status.HTTP_201_CREATED)
async def upload_avatar_admin(
    project_uuid: UUID,
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an avatar for a project (admin only)."""
    # Validate file extension
    if not file.filename or not file.filename.lower().endswith('.gab'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .gab files are allowed"
        )

    # Verify project exists
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Reset file pointer
    await file.seek(0)

    # Save file
    stored_filename, original_filename = await save_avatar_file(file)

    # Create avatar record
    avatar = Avatar(
        project_id=project.id,
        filename=stored_filename,
        original_filename=original_filename,
        file_size=file_size,
        is_active=True,
    )

    db.add(avatar)
    await db.commit()
    await db.refresh(avatar)

    avatar_dict = await _build_avatar_response(avatar)
    return AvatarResponse(**avatar_dict)


@router.get("/projects/{project_uuid}", response_model=AvatarListResponse)
async def list_avatars_admin(
    project_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all avatars for a project (admin only)."""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Get avatars
    query = select(Avatar).where(Avatar.project_id == project.id).order_by(Avatar.created_at.desc())
    result = await db.execute(query)
    avatars = list(result.scalars().all())

    # Get total count
    count_result = await db.execute(select(func.count(Avatar.id)).where(Avatar.project_id == project.id))
    total = count_result.scalar() or 0

    avatar_responses = [AvatarResponse(**await _build_avatar_response(avatar)) for avatar in avatars]
    return AvatarListResponse(avatars=avatar_responses, total=total)


@router.delete("/{avatar_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar_admin(
    avatar_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an avatar (admin only)."""
    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )

    # Delete physical file
    file_path = get_avatar_path(avatar.filename)
    if file_path.exists():
        file_path.unlink()

    # Delete from database
    await db.delete(avatar)
    await db.commit()

    return None


@router.get("/{avatar_uuid}/download")
async def download_avatar_admin(
    avatar_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Download an avatar file (admin only)."""
    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )

    file_path = get_avatar_path(avatar.filename)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar file not found"
        )

    # Read file content
    with open(file_path, "rb") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{avatar.original_filename}"'
        }
    )


# Customer endpoints
@customer_router.post("/projects/{project_uuid}/upload", response_model=AvatarResponse, status_code=status.HTTP_201_CREATED)
async def upload_avatar_customer(
    project_uuid: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an avatar for a project (customer only)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer"
        )

    # Validate file extension
    if not file.filename or not file.filename.lower().endswith('.gab'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .gab files are allowed"
        )

    # Verify project exists and belongs to customer
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Reset file pointer
    await file.seek(0)

    # Save file
    stored_filename, original_filename = await save_avatar_file(file)

    # Create avatar record
    avatar = Avatar(
        project_id=project.id,
        filename=stored_filename,
        original_filename=original_filename,
        file_size=file_size,
        is_active=True,
    )

    db.add(avatar)
    await db.commit()
    await db.refresh(avatar)

    avatar_dict = await _build_avatar_response(avatar)
    return AvatarResponse(**avatar_dict)


@customer_router.get("/projects/{project_uuid}", response_model=AvatarListResponse)
async def list_avatars_customer(
    project_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all avatars for a project (customer only)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer"
        )

    # Verify project exists and belongs to customer
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get avatars
    query = select(Avatar).where(Avatar.project_id == project.id).order_by(Avatar.created_at.desc())
    result = await db.execute(query)
    avatars = list(result.scalars().all())

    # Get total count
    count_result = await db.execute(select(func.count(Avatar.id)).where(Avatar.project_id == project.id))
    total = count_result.scalar() or 0

    avatar_responses = [AvatarResponse(**await _build_avatar_response(avatar)) for avatar in avatars]
    return AvatarListResponse(avatars=avatar_responses, total=total)


@customer_router.delete("/{avatar_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar_customer(
    avatar_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an avatar (customer only, must own project)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer"
        )

    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )

    # Verify project belongs to customer
    project_result = await db.execute(select(Project).where(Project.id == avatar.project_id))
    project = project_result.scalar_one_or_none()
    
    if not project or project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Delete physical file
    file_path = get_avatar_path(avatar.filename)
    if file_path.exists():
        file_path.unlink()

    # Delete from database
    await db.delete(avatar)
    await db.commit()

    return None


@customer_router.get("/{avatar_uuid}/download")
async def download_avatar_customer(
    avatar_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download an avatar file (customer only, must own project)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer"
        )

    result = await db.execute(select(Avatar).where(Avatar.uuid == avatar_uuid))
    avatar = result.scalar_one_or_none()

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )

    # Verify project belongs to customer
    project_result = await db.execute(select(Project).where(Project.id == avatar.project_id))
    project = project_result.scalar_one_or_none()
    
    if not project or project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    file_path = get_avatar_path(avatar.filename)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar file not found"
        )

    # Read file content
    with open(file_path, "rb") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{avatar.original_filename}"'
        }
    )
