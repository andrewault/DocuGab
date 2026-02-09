"""Demo projects admin routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.project import Project
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_demo_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """List all projects marked as demo."""
    result = await db.execute(
        select(Project)
        .where(Project.is_demo)
        .options(selectinload(Project.customer))
        .order_by(Project.is_active_demo.desc(), Project.name)
    )
    projects = result.scalars().all()

    return {
        "projects": [
            {
                "id": p.id,
                "uuid": str(p.uuid),
                "name": p.name,
                "slug": p.slug,
                "customer_name": p.customer.name if p.customer else None,
                "is_active_demo": p.is_active_demo,
                "is_enabled": p.is_enabled,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ]
    }


@router.post("/{uuid}/activate")
async def activate_demo_project(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Set a project as the active demo project."""
    # Find the project
    result = await db.execute(select(Project).where(Project.uuid == uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.is_demo:
        raise HTTPException(
            status_code=400, detail="Project must be marked as demo to be activated"
        )

    # Activate the selected project
    project.is_active_demo = True
    await db.commit()

    return {"message": f"'{project.name}' is now the active demo project"}


@router.post("/{uuid}/deactivate")
async def deactivate_demo_project(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Deactivate a demo project."""
    result = await db.execute(select(Project).where(Project.uuid == uuid))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_active_demo = False
    await db.commit()

    return {"message": f"'{project.name}' is no longer the active demo project"}
