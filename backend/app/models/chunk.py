from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from typing import TYPE_CHECKING

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int | None]
    chunk_index: Mapped[int]

    # Vector embedding (768 dimensions for Ollama nomic-embed-text)
    embedding = mapped_column(Vector(768), nullable=True)

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="chunks")
