"""FAQ API routes."""

from typing import Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.faq import FAQ
from app.models.user import User

router = APIRouter(prefix="/api/faq", tags=["faq"])


class FAQCreate(BaseModel):
    question: str
    answer: str
    order: int = 0
    is_active: bool = True


class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class FAQResponse(BaseModel):
    id: int
    uuid: UUID
    question: str
    answer: str
    order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/")
async def list_faqs(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List FAQs (public endpoint)."""
    query = select(FAQ).order_by(FAQ.order, FAQ.id)
    if not include_inactive:
        query = query.where(FAQ.is_active)

    result = await db.execute(query)
    faqs = result.scalars().all()
    return {"faqs": [FAQResponse.model_validate(f) for f in faqs]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_faq(
    data: FAQCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Create a new FAQ (admin only)."""
    faq = FAQ(
        question=data.question,
        answer=data.answer,
        order=data.order,
        is_active=data.is_active,
    )
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.patch("/{faq_uuid}")
async def update_faq(
    faq_uuid: UUID,
    data: FAQUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Update an FAQ (admin only)."""
    result = await db.execute(select(FAQ).where(FAQ.uuid == faq_uuid))
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(faq, key, value)

    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.delete("/{faq_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    faq_uuid: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Delete an FAQ (admin only)."""
    result = await db.execute(select(FAQ).where(FAQ.uuid == faq_uuid))
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    await db.delete(faq)
    await db.commit()
