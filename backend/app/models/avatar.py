"""Avatar model for project GAB files."""

from uuid import uuid4
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Avatar(Base):
    """Avatar model for storing GAB files associated with projects."""

    __tablename__ = "avatars"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)  # {uuid}.gab
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="avatars")

    def __repr__(self):
        return f"<Avatar(uuid={self.uuid}, project_id={self.project_id}, filename={self.filename})>"
