"""Shared utilities for project routes."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.project import Project
from app.models.customer import Customer
from app.models.document import Document


async def build_project_response(project: Project, db: AsyncSession) -> dict:
    """Build standardized project response dictionary with counts and customer info.
    
    Args:
        project: Project model instance
        db: Database session for querying related data
        
    Returns:
        Dictionary with all project fields for API response
    """
    # Count documents
    docs_count_result = await db.execute(
        select(func.count(Document.id)).where(Document.project_id == project.id)
    )
    documents_count = docs_count_result.scalar() or 0

    # Get customer name and uuid
    customer_result = await db.execute(
        select(Customer.name, Customer.uuid).where(Customer.id == project.customer_id)
    )
    customer_data = customer_result.one_or_none()
    customer_name = customer_data[0] if customer_data else None
    customer_uuid = customer_data[1] if customer_data else None

    # Compute ready status (requires avatar, voice, and at least 1 document)
    is_ready = bool(project.avatar and project.voice and documents_count > 0)

    return {
        "id": project.id,
        "uuid": project.uuid,
        "customer_id": project.customer_id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "logo": project.logo,
        "title": project.title,
        "subtitle": project.subtitle,
        "body": project.body,
        "color_primary": project.color_primary,
        "color_secondary": project.color_secondary,
        "color_background": project.color_background,
        "avatar": project.avatar,
        "voice": project.voice,
        "return_link": project.return_link,
        "return_link_text": project.return_link_text,
        "is_demo": project.is_demo,
        "is_active": project.is_active,
        "is_enabled": project.is_enabled,
        "is_ready": is_ready,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "documents_count": documents_count,
        "customer_name": customer_name,
        "customer_uuid": customer_uuid,
    }
