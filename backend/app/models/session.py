"""Session model for refresh tokens."""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Session(Base):
    """User session for refresh token management."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    refresh_token: Mapped[str] = mapped_column(
        String(500), unique=True, index=True, nullable=False
    )
    device_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")
