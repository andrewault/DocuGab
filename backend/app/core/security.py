"""Security utilities for authentication."""
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt, JWTError

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    """Create a JWT refresh token. Returns (token, expires_at)."""
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "type": "refresh",
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")
    return token, expires_at


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
