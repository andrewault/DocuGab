"""Project management API routes (admin only)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.project import Project
from app.models.document import Document
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.services.storage import save_logo_file, get_logo_path


router = APIRouter(prefix="/admin/projects", tags=["admin", "projects"])
customer_router = APIRouter(prefix="/customer/projects", tags=["customer", "projects"])


async def _build_project_response(project: Project, db: AsyncSession) -> dict:
    """Helper to build project response with counts and customer name."""
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

    return {
        "id": project.id,
        "uuid": project.uuid,
        "customer_id": project.customer_id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "subdomain": project.subdomain,
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
        "is_active": project.is_active,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "documents_count": documents_count,
        "customer_name": customer_name,
        "customer_uuid": customer_uuid,
    }


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
        search_filter = Project.name.ilike(f"%{search}%") | Project.subdomain.ilike(
            f"%{search}%"
        )
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
        project_dict = await _build_project_response(project, db)
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

    project_dict = await _build_project_response(project, db)
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

    # Check subdomain uniqueness
    subdomain_check = await db.execute(
        select(Project).where(Project.subdomain == data.subdomain)
    )
    if subdomain_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subdomain '{data.subdomain}' is already in use",
        )

    # Create project
    project = Project(
        customer_id=data.customer_id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        subdomain=data.subdomain,
        logo=data.logo,
        title=data.title,
        subtitle=data.subtitle,
        body=data.body,
        color_primary=data.color_primary,
        color_secondary=data.color_secondary,
        color_background=data.color_background,
        avatar=data.avatar,
        voice=data.voice,
        return_link=data.return_link,
        return_link_text=data.return_link_text,
        is_active=True,
    )

    db.add(project)
    await db.commit()
    await db.refresh(project)

    project_dict = await _build_project_response(project, db)
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

    # Check subdomain uniqueness if being updated
    if data.subdomain and data.subdomain != project.subdomain:
        subdomain_check = await db.execute(
            select(Project).where(Project.subdomain == data.subdomain)
        )
        if subdomain_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Subdomain '{data.subdomain}' is already in use",
            )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    project_dict = await _build_project_response(project, db)
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


# Customer-accessible endpoints
@customer_router.get("", response_model=ProjectListResponse)
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
        project_dict = await _build_project_response(project, db)
        project_responses.append(ProjectResponse(**project_dict))

    return ProjectListResponse(
        projects=project_responses,
        total=total,
        page=page,
        per_page=per_page,
    )


@customer_router.get("/{project_uuid}", response_model=ProjectResponse)
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


    project_dict = await _build_project_response(project, db)
    return ProjectResponse(**project_dict)


@customer_router.patch("/{project_uuid}", response_model=ProjectResponse)
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

    project_dict = await _build_project_response(project, db)
    return ProjectResponse(**project_dict)


@customer_router.post("/{project_uuid}/logo")
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


@customer_router.get("/{project_uuid}/logo")
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
