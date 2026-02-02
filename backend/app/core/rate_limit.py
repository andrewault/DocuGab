"""Rate limiting configuration using slowapi."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

from app.core.config import settings

# Create rate limiter with default limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit_default]
    if hasattr(settings, "rate_limit_default")
    else ["100/minute"],
    storage_uri=settings.redis_url if hasattr(settings, "redis_url") else "memory://",
)

# Exception handler for rate limit exceeded
rate_limit_handler = _rate_limit_exceeded_handler
