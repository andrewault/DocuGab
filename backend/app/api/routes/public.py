from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.project import Project
from app.models.document import Document
from app.models.avatar import Avatar
from app.schemas.project import PublicProjectResponse, AvatarInfo

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/projects/{slug}", response_model=PublicProjectResponse)
async def get_public_project(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public project details by slug.
    Only returns active and enabled projects.
    """
    # Query project by slug
    query = select(Project).where(
        Project.slug == slug, Project.is_active, Project.is_enabled
    )
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Count active documents
    docs_query = select(func.count(Document.id)).where(
        Document.project_id == project.id
    )
    docs_result = await db.execute(docs_query)
    documents_count = docs_result.scalar() or 0

    # Determine readiness (matches logic in frontend/ProjectEdit showing animation toggle note)
    is_ready = documents_count > 0
    if not project.show_animation:
        # If animation is disabled, we consider it ready if documents exist
        # If animation is enabled, maybe we need other checks?
        # For now, simplistic logic: >0 docs = ready.
        pass

    # Load avatar if project has avatar_id
    avatar_info = None
    if project.avatar_id:
        avatar_result = await db.execute(
            select(Avatar).where(Avatar.id == project.avatar_id)
        )
        avatar = avatar_result.scalar_one_or_none()
        if avatar:
            avatar_info = AvatarInfo(
                id=avatar.id,
                uuid=avatar.uuid,
                name=avatar.name,
                file_path=avatar.file_path,
                thumbnail_url=avatar.thumbnail_url,
            )

    return PublicProjectResponse(
        uuid=project.uuid,
        name=project.name,
        slug=project.slug,

        subtitle=project.subtitle,
        body=project.body,
        color_primary=project.color_primary,
        color_secondary=project.color_secondary,
        color_background=project.color_background,
        avatar=avatar_info,
        voice=project.voice,
        show_animation=project.show_animation,
        return_link=project.return_link,
        return_link_text=project.return_link_text,
        is_demo=project.is_demo,
        is_enabled=project.is_enabled,
        logo=project.logo,
        is_ready=is_ready,
        documents_count=documents_count,
    )


@router.get("/demos", response_model=list[PublicProjectResponse])
async def list_public_demos(
    db: AsyncSession = Depends(get_db),
):
    """
    List all enabled demo projects.
    Ordered by Featured (is_active_demo) DESC, then Created At DESC.
    """
    query = (
        select(Project)
        .where(Project.is_demo, Project.is_enabled, Project.is_active)
        .order_by(Project.is_active_demo.desc(), Project.created_at.desc())
    )
    result = await db.execute(query)
    projects = result.scalars().all()

    response_list = []
    for project in projects:
        # Check document count to determine readiness
        docs_query = select(func.count(Document.id)).where(
            Document.project_id == project.id
        )
        docs_result = await db.execute(docs_query)
        documents_count = docs_result.scalar() or 0
        
        # Filter out empty projects (not ready)
        if documents_count == 0:
            continue

        # Load avatar if present
        avatar_info = None
        if project.avatar_id:
            avatar_result = await db.execute(
                select(Avatar).where(Avatar.id == project.avatar_id)
            )
            avatar = avatar_result.scalar_one_or_none()
            if avatar:
                avatar_info = AvatarInfo(
                    id=avatar.id,
                    uuid=avatar.uuid,
                    name=avatar.name,
                    file_path=avatar.file_path,
                    thumbnail_url=avatar.thumbnail_url,
                )

        # Simplified response for list
        response_list.append(
            PublicProjectResponse(
                uuid=project.uuid,
                name=project.name,
                slug=project.slug,

                subtitle=project.subtitle,
                body=project.body,
                color_primary=project.color_primary,
                color_secondary=project.color_secondary,
                color_background=project.color_background,
                avatar=avatar_info,
                voice=project.voice,
                show_animation=project.show_animation,
                return_link=project.return_link,
                return_link_text=project.return_link_text,
                is_demo=project.is_demo,
                is_enabled=project.is_enabled,
                logo=project.logo,
                is_ready=True,  # Confirmed by docs check
                documents_count=documents_count,
            )
        )

    return response_list
