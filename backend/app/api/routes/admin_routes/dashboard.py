from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from app.core.deps import get_admin_user
from app.core.database import get_db
from app.core.config import settings
from app.models.project import Project
from app.models.user import User

router = APIRouter()


@router.get("/health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    """
    Get system health status (DB, Redis, Version).
    """
    status = {
        "database": "unknown",
        "redis": "unknown",
        "version": "1.0.0",  # TODO: Pull from package or config
    }

    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        status["database"] = "healthy"
    except Exception as e:
        status["database"] = "unhealthy"
        status["database_error"] = str(e)

    # Check Redis
    try:
        r = redis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        status["redis"] = "healthy"
    except Exception as e:
        status["redis"] = "unhealthy"
        status["redis_error"] = str(e)

    return status


# ...


@router.get("/recent-activity")
async def get_recent_activity(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user),
) -> Dict[str, List[Any]]:
    """
    Get recent activity for the dashboard (Projects, Users).
    """
    # Recent Projects (updated recently)
    projects_query = (
        select(Project)
        .options(joinedload(Project.customer))
        .order_by(Project.updated_at.desc())
        .limit(5)
    )
    projects_result = await db.execute(projects_query)
    recent_projects = projects_result.scalars().all()

    # Recent Users (joined recently)
    users_query = select(User).order_by(User.created_at.desc()).limit(5)
    users_result = await db.execute(users_query)
    recent_users = users_result.scalars().all()

    return {
        "projects": [
            {
                "uuid": p.uuid,
                "name": p.name,
                "updated_at": p.updated_at,
                "customer_name": p.customer.name if p.customer else "Unknown",
                "slug": p.slug,
            }
            for p in recent_projects
        ],
        "users": [
            {
                "uuid": u.uuid,
                "email": u.email,
                "full_name": u.full_name,
                "created_at": u.created_at,
                "is_active": u.is_active,
            }
            for u in recent_users
        ],
    }
