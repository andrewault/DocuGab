"""Customer project management API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import (
    ProjectResponse,
    ProjectListResponse,
)
from app.services.storage import save_logo_file, get_logo_path
from app.api.routes.project_utils import build_project_response


router = APIRouter(prefix="/customer/projects", tags=["customer", "projects"])


@router.get("", response_model=ProjectListResponse)
async def list_customer_projects(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List projects for the current customer user."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Build query filtered by user's customer_id
    query = select(Project).where(Project.customer_id == user.customer_id)
    count_query = select(func.count(Project.id)).where(
        Project.customer_id == user.customer_id
    )

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(Project.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    # Execute query
    result = await db.execute(query)
    projects = list(result.scalars().all())

    # Build responses
    project_responses = []
    for project in projects:
        project_dict = await build_project_response(project, db)
        project_responses.append(ProjectResponse(**project_dict))

    return ProjectListResponse(
        projects=project_responses,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{project_uuid}", response_model=ProjectResponse)
async def get_customer_project(
    project_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project by UUID (customer must own it)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify the project belongs to the user's customer
    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    project_dict = await build_project_response(project, db)
    return ProjectResponse(**project_dict)


@router.patch("/{project_uuid}", response_model=ProjectResponse)
async def update_customer_project(
    project_uuid: UUID,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    description: Optional[str] = None,
    subtitle: Optional[str] = None,
    body: Optional[str] = None,
    color_primary: Optional[str] = None,
    color_secondary: Optional[str] = None,
    color_background: Optional[str] = None,
    return_link: Optional[str] = None,
    return_link_text: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project's editable fields (customer must own it)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this project",
        )

    # Update fields if provided
    if name is not None:
        project.name = name
    if slug is not None:
        project.slug = slug
    if description is not None:
        project.description = description
    if subtitle is not None:
        project.subtitle = subtitle
    if body is not None:
        project.body = body
    if color_primary is not None:
        project.color_primary = color_primary
    if color_secondary is not None:
        project.color_secondary = color_secondary
    if color_background is not None:
        project.color_background = color_background
    if return_link is not None:
        project.return_link = return_link
    if return_link_text is not None:
        project.return_link_text = return_link_text

    await db.commit()
    await db.refresh(project)

    project_dict = await build_project_response(project, db)
    return ProjectResponse(**project_dict)


@router.post("/{project_uuid}/logo")
async def upload_project_logo(
    project_uuid: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a logo for a project (PNG only)."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Validate file type
    if not file.content_type or file.content_type != "image/png":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG files are allowed",
        )

    # Get project and verify ownership
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this project",
        )

    # Save the logo file
    filename = await save_logo_file(file, str(project_uuid))
    
    # Update project logo field
    project.logo = f"/api/customer/projects/{project_uuid}/logo"
    await db.commit()

    return {"message": "Logo uploaded successfully", "filename": filename}


@router.get("/{project_uuid}/logo")
async def get_project_logo(
    project_uuid: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the logo for a project."""
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with a customer",
        )

    # Get project and verify ownership
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this project",
        )

    # Get logo file path
    logo_filename = f"{project_uuid}.png"
    logo_path = get_logo_path(logo_filename)

    if not logo_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Logo not found",
        )

    return FileResponse(logo_path, media_type="image/png")
