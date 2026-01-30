from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.api.routes import (
    health,
    documents,
    chat,
    auth,
    users,
    admin,
    faq,
    speech,
    customers,
    projects,
    public,
    database,
    avatars,
)
from app.middleware import SubdomainMiddleware


async def seed_admin_user():
    """Create initial admin user if configured and not exists."""
    if not settings.admin_username or not settings.admin_password:
        return

    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == settings.admin_username.lower())
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update to superadmin if not already
            if existing.role != "superadmin":
                existing.role = "superadmin"
                await db.commit()
                print(f"Updated {settings.admin_username} to superadmin")
            return

        # Create new admin user
        admin_user = User(
            email=settings.admin_username.lower(),
            password_hash=hash_password(settings.admin_password),
            full_name="Admin",
            role="superadmin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        await db.commit()
        print(f"Created admin user: {settings.admin_username}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await seed_admin_user()
    yield
    # Shutdown


app = FastAPI(
    title="DocuTok API",
    description="RAG-based document intelligence platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Subdomain middleware
app.add_middleware(SubdomainMiddleware)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(public.router, tags=["Public"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(database.router, prefix="/api/admin/database", tags=["Database"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(projects.customer_router, prefix="/api", tags=["Customer Projects"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(speech.router, prefix="/api/speech", tags=["Speech"])
app.include_router(faq.router, tags=["FAQ"])
app.include_router(avatars.router, prefix="/api", tags=["Avatars"])
app.include_router(avatars.customer_router, prefix="/api", tags=["Customer Avatars"])
