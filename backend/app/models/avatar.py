"""Avatar model for customer-scoped 3D avatars."""

from uuid import uuid4
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.project import Project


class Avatar(Base):
    """Avatar model for storing GLB/FBX 3D avatar files.
    
    Avatars are customer-scoped, except for the "Default" avatar which
    is globally available (customer_id = NULL).
    """

    __tablename__ = "avatars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uuid: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), default=uuid4, unique=True, index=True, nullable=False
    )
    
    # Customer scoping (NULL = global/Default avatar)
    customer_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Avatar metadata
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)  # S3 key or local path
    file_extension: Mapped[str] = mapped_column(String(10), nullable=False)  # glb, fbx
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationships
    customer: Mapped["Customer | None"] = relationship(back_populates="avatars")
    projects: Mapped[list["Project"]] = relationship(back_populates="avatar")

    # Ensure only one "Default" avatar can exist
    __table_args__ = (
        Index(
            "ix_avatars_default_unique",
            "name",
            unique=True,
            postgresql_where=(name == "Default"),
        ),
    )

    def __repr__(self):
        return f"<Avatar(uuid={self.uuid}, name={self.name}, customer_id={self.customer_id})>"
