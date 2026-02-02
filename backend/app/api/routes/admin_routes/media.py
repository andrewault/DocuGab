from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.project import Project
from app.models.media import ProjectMedia
from app.schemas.media import MediaCreate, MediaResponse

router = APIRouter(tags=["admin", "projects"])

@router.get("/projects/{project_uuid}/media", response_model=list[MediaResponse])
async def list_project_media(
    project_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List media for a project."""
    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
        
    media_result = await db.execute(select(ProjectMedia).where(ProjectMedia.project_id == project.id))
    return media_result.scalars().all()

@router.post("/projects/{project_uuid}/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def create_project_media(
    project_uuid: UUID,
    data: MediaCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Add media to a project."""
    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
        
    media = ProjectMedia(
        project_id=project.id,
        type=data.type,
        url=data.url,
        description=data.description,
        keywords=data.keywords
    )
    
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return media

@router.delete("/projects/{project_uuid}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_media(
    project_uuid: UUID,
    media_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete media from a project."""
    # Verify project exists and get it
    project_result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get media and verify it belongs to project
    result = await db.execute(
        select(ProjectMedia).where(
            ProjectMedia.id == media_id,
            ProjectMedia.project_id == project.id
        )
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
        
    await db.delete(media)
    await db.commit()
