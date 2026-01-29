"""Customer model for multi-tenant system."""
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.project import Project


class Customer(Base):
    """Customer organization model."""
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Contact Information
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Metadata
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    projects: Mapped[list["Project"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
