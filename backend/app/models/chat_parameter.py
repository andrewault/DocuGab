"""ChatParameter model for configurable chat settings."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ChatParameter(Base):
    """Model for storing chat parameter presets."""

    __tablename__ = "chat_parameters"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(
        UUID(as_uuid=True), default=uuid4, unique=True, nullable=False, index=True
    )
    name = Column(String(100), nullable=False)
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, default=0.2, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
