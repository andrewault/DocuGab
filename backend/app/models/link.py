from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
import uuid as uuid_pkg

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.project import Project


class ProjectLink(Base):
    __tablename__ = "project_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(
        PG_UUID(as_uuid=True), default=uuid_pkg.uuid4, unique=True, index=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(Text)
    keywords: Mapped[list[str]] = mapped_column(JSONB)

    project: Mapped["Project"] = relationship(back_populates="links")
