"""Schemas package."""
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    UserResponse,
    UserUpdate,
    PasswordChange,
)
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
)
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)

__all__ = [
    "UserRegister",
    "UserLogin",
    "TokenResponse",
    "TokenRefresh",
    "UserResponse",
    "UserUpdate",
    "PasswordChange",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "CustomerListResponse",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListResponse",
]
