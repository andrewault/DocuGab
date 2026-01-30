"""Project model for multi-tenant system."""

from datetime import datetime
from typing import TYPE_CHECKING
import uuid as uuid_lib
from sqlalchemy import Integer, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.document import Document
    from app.models.avatar import Avatar


class Project(Base):
    """Project model with branding and configuration."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uuid: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False,
        index=True,
        default=uuid_lib.uuid4,
    )
    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Subdomain & Access
    subdomain: Mapped[str] = mapped_column(
        String(63), unique=True, nullable=False, index=True
    )

    # Branding
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    color_primary: Mapped[str] = mapped_column(String(7), nullable=False)  # Hex color
    color_secondary: Mapped[str] = mapped_column(String(7), nullable=False)  # Hex color
    color_background: Mapped[str] = mapped_column(
        String(7), nullable=False
    )  # Hex color

    # Avatar & Voice
    avatar: Mapped[str] = mapped_column(String(500), nullable=False)
    voice: Mapped[str] = mapped_column(String(100), nullable=False)

    # Navigation
    return_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    return_link_text: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Metadata
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="projects")
    documents: Mapped[list["Document"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    avatars: Mapped[list["Avatar"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
