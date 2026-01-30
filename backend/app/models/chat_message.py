"""Chat message model for persisting chat history."""

import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatMessage(Base):
    """Persisted chat message."""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id = Column(
        UUID(as_uuid=True), default=uuid_lib.uuid4, nullable=False, index=True
    )
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    document_filter_id = Column(
        Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="chat_messages")
    document_filter = relationship("Document")
