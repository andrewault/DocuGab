"""Admin API routes for ChatParameter management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.chat_parameter import ChatParameter
from app.schemas.chat_parameter import (
    ChatParameterCreate,
    ChatParameterUpdate,
    ChatParameterResponse,
    ChatParameterListResponse,
)
from app.services.chat import invalidate_chat_parameter_cache

router = APIRouter(tags=["Chat Parameters"])


@router.get("/", response_model=ChatParameterListResponse)
async def list_chat_parameters(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all chat parameters."""
    result = await db.execute(
        select(ChatParameter).order_by(ChatParameter.created_at.desc())
    )
    parameters = list(result.scalars().all())
    return ChatParameterListResponse(parameters=parameters, total=len(parameters))


@router.get("/active", response_model=ChatParameterResponse)
async def get_active_chat_parameter(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the currently active chat parameter."""
    result = await db.execute(select(ChatParameter).where(ChatParameter.is_active))
    param = result.scalar_one_or_none()
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active chat parameter found",
        )
    return param


@router.post(
    "/", response_model=ChatParameterResponse, status_code=status.HTTP_201_CREATED
)
async def create_chat_parameter(
    data: ChatParameterCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat parameter."""
    param = ChatParameter(
        name=data.name,
        system_prompt=data.system_prompt,
        temperature=data.temperature,
        is_active=False,
    )
    db.add(param)
    await db.commit()
    await db.refresh(param)
    return param


@router.get("/{uuid}", response_model=ChatParameterResponse)
async def get_chat_parameter(
    uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific chat parameter by UUID."""
    result = await db.execute(select(ChatParameter).where(ChatParameter.uuid == uuid))
    param = result.scalar_one_or_none()
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat parameter not found",
        )
    return param


@router.put("/{uuid}", response_model=ChatParameterResponse)
async def update_chat_parameter(
    uuid: UUID,
    data: ChatParameterUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a chat parameter."""
    result = await db.execute(select(ChatParameter).where(ChatParameter.uuid == uuid))
    param = result.scalar_one_or_none()
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat parameter not found",
        )

    if data.name is not None:
        param.name = data.name
    if data.system_prompt is not None:
        param.system_prompt = data.system_prompt
    if data.temperature is not None:
        param.temperature = data.temperature

    await db.commit()
    await db.refresh(param)

    # Invalidate cache if this was the active parameter
    if param.is_active:
        invalidate_chat_parameter_cache()

    return param


@router.delete("/{uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_parameter(
    uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a chat parameter."""
    result = await db.execute(select(ChatParameter).where(ChatParameter.uuid == uuid))
    param = result.scalar_one_or_none()
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat parameter not found",
        )

    if param.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the active chat parameter",
        )

    await db.delete(param)
    await db.commit()


@router.post("/{uuid}/activate", response_model=ChatParameterResponse)
async def activate_chat_parameter(
    uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Set a chat parameter as the active one."""
    # Get the parameter to activate
    result = await db.execute(select(ChatParameter).where(ChatParameter.uuid == uuid))
    param = result.scalar_one_or_none()
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat parameter not found",
        )

    # Deactivate all other parameters
    all_result = await db.execute(select(ChatParameter))
    all_params = all_result.scalars().all()
    for p in all_params:
        p.is_active = False

    # Activate the selected one
    param.is_active = True

    await db.commit()
    await db.refresh(param)

    # Invalidate cache so new activation is picked up immediately
    invalidate_chat_parameter_cache()

    return param
