"""Admin project management API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.customer import Customer
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.services.storage import save_logo_file, get_logo_path
from app.api.routes.project_utils import build_project_response


router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    search: Optional[str] = Query(None, description="Search by name or subdomain"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all projects with pagination and filters."""
    # Build query
    query = select(Project)
    count_query = select(func.count(Project.id))

    # Apply filters
    filters = []
    if customer_id:
        filters.append(Project.customer_id == customer_id)
    if search:
        search_filter = Project.name.ilike(f"%{search}%")
        filters.append(search_filter)

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

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
async def get_project(
    project_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project by UUID."""
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project_dict = await build_project_response(project, db)
    return ProjectResponse(**project_dict)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer).where(Customer.id == data.customer_id)
    )
    customer = customer_result.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {data.customer_id} not found",
        )

    # Check for duplicate slug
    slug_result = await db.execute(select(Project).where(Project.slug == data.slug))
    existing_project = slug_result.scalar_one_or_none()
    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project with slug '{data.slug}' already exists",
        )

    # Internal Flags Exclusivity
    if data.is_demo:
        await db.execute(update(Project).values(is_demo=False))

    # Create project
    project = Project(
        customer_id=data.customer_id,
        name=data.name,
        slug=data.slug,
        logo=data.logo,
        title=data.title,
        subtitle=data.subtitle,
        body=data.body,
        color_primary=data.color_primary,
        color_secondary=data.color_secondary,
        color_background=data.color_background,
        avatar_id=data.avatar_id,
        voice=data.voice,
        return_link=data.return_link,
        return_link_text=data.return_link_text,
        is_active=True,
        is_demo=data.is_demo,
    )

    db.add(project)
    await db.commit()
    await db.refresh(project)

    project_dict = await build_project_response(project, db)
    return ProjectResponse(**project_dict)


@router.patch("/{project_uuid}", response_model=ProjectResponse)
async def update_project(
    project_uuid: UUID,
    data: ProjectUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)

    # Check for duplicate slug if slug is being updated
    if "slug" in update_data:
        slug_result = await db.execute(
            select(Project).where(
                and_(Project.slug == update_data["slug"], Project.id != project.id)
            )
        )
        existing_project = slug_result.scalar_one_or_none()
        if existing_project:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Project with slug '{update_data['slug']}' already exists",
            )

    # Internal Flags Exclusivity
    if update_data.get("is_demo"):
        await db.execute(
            update(Project).where(Project.id != project.id).values(is_demo=False)
        )

    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    project_dict = await build_project_response(project, db)
    return ProjectResponse(**project_dict)


@router.delete("/{project_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project (cascades to documents)."""
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    await db.delete(project)
    await db.commit()

    return None


@router.post("/{project_uuid}/logo")
async def upload_project_logo(
    project_uuid: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a logo for a project (PNG only)."""
    # Validate file type
    if not file.content_type or file.content_type != "image/png":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG files are allowed",
        )

    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Save the logo file
    filename = await save_logo_file(file, str(project_uuid))

    # Update project logo field
    project.logo = f"/api/admin/projects/{project_uuid}/logo"
    await db.commit()

    return {"message": "Logo uploaded successfully", "filename": filename}


@router.get("/{project_uuid}/logo")
async def get_project_logo(
    project_uuid: UUID,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the logo for a project."""
    # Get project
    result = await db.execute(select(Project).where(Project.uuid == project_uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
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
