from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.project import Project
from app.models.link import ProjectLink
from app.schemas.link import LinkCreate, LinkResponse

router = APIRouter()


@router.get("/projects/{project_uuid}/links", response_model=list[LinkResponse])
async def list_project_links(
    project_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List links for a project."""
    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    links_result = await db.execute(
        select(ProjectLink).where(ProjectLink.project_id == project.id)
    )
    return links_result.scalars().all()


@router.post(
    "/projects/{project_uuid}/links",
    response_model=LinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_link(
    project_uuid: UUID,
    data: LinkCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a link to a project."""
    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    link = ProjectLink(
        project_id=project.id, name=data.name, url=data.url, keywords=data.keywords
    )

    db.add(link)
    await db.commit()
    await db.refresh(link)

    return link


@router.put("/projects/{project_uuid}/links/{link_id}", response_model=LinkResponse)
async def update_project_link(
    project_uuid: UUID,
    link_id: int,
    data: LinkCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a link in a project."""
    # Verify project exists
    project_result = await db.execute(
        select(Project).where(Project.uuid == project_uuid)
    )
    project = project_result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get link and verify ownership
    result = await db.execute(
        select(ProjectLink).where(
            ProjectLink.id == link_id, ProjectLink.project_id == project.id
        )
    )
    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )

    for key, value in data.model_dump().items():
        setattr(link, key, value)

    await db.commit()
    await db.refresh(link)

    return link


@router.delete(
    "/projects/{project_uuid}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_project_link(
    project_uuid: UUID,
    link_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete link from a project."""
    # Verify project exists
    project_result = await db.execute(
        select(Project).where(Project.uuid == project_uuid)
    )
    project = project_result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get link and verify ownership
    result = await db.execute(
        select(ProjectLink).where(
            ProjectLink.id == link_id, ProjectLink.project_id == project.id
        )
    )
    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )

    await db.delete(link)
    await db.commit()
