"""Public project configuration API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectResponse

router = APIRouter(prefix="/api/public/projects")


@router.get("/by-subdomain/{subdomain}", response_model=ProjectResponse)
async def get_project_by_subdomain(
    subdomain: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public project configuration by subdomain.
    
    This endpoint is publicly accessible and returns project branding
    and configuration data needed to render the chat interface.
    """
    # Query project by subdomain
    result = await db.execute(
        select(Project)
        .where(Project.subdomain == subdomain)
        .where(Project.is_active == True)  # noqa: E712
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active project found for subdomain '{subdomain}'",
        )
    
    # Build response with customer name
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.customer))
        .where(Project.id == project.id)
    )
    project_with_customer = result.scalar_one()
    
    # Get document count
    from app.models.document import Document
    from sqlalchemy import func
    
    doc_count_result = await db.execute(
        select(func.count(Document.id)).where(Document.project_id == project.id)
    )
    documents_count = doc_count_result.scalar() or 0
    
    # Build response
    project_dict = {
        "id": project_with_customer.id,
        "customer_id": project_with_customer.customer_id,
        "name": project_with_customer.name,
        "slug": project_with_customer.slug,
        "description": project_with_customer.description,
        "subdomain": project_with_customer.subdomain,
        "logo": project_with_customer.logo,
        "title": project_with_customer.title,
        "subtitle": project_with_customer.subtitle,
        "body": project_with_customer.body,
        "color_primary": project_with_customer.color_primary,
        "color_secondary": project_with_customer.color_secondary,
        "color_background": project_with_customer.color_background,
        "avatar": project_with_customer.avatar,
        "voice": project_with_customer.voice,
        "return_link": project_with_customer.return_link,
        "return_link_text": project_with_customer.return_link_text,
        "is_active": project_with_customer.is_active,
        "created_at": project_with_customer.created_at,
        "updated_at": project_with_customer.updated_at,
        "documents_count": documents_count,
        "customer_name": project_with_customer.customer.name if project_with_customer.customer else None,
    }
    
    return ProjectResponse(**project_dict)
