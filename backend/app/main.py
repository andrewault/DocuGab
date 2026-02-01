from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.core.rate_limit import limiter, rate_limit_handler
from app.models.user import User
from app.api import v1 as api_v1
from app.api.routes import health


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
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Backwards compatibility middleware - redirect /api/* to /api/v1/*
@app.middleware("http")
async def api_version_redirect(request: Request, call_next):
    """Redirect /api/* requests to /api/v1/* for backwards compatibility."""
    path = request.url.path
    
    # Skip redirect for CORS preflight (OPTIONS) requests
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Skip if already versioned or health check
    if path.startswith("/api/v1/") or path == "/health":
        return await call_next(request)
    
    # Redirect /api/* to /api/v1/*
    if path.startswith("/api/"):
        new_path = path.replace("/api/", "/api/v1/", 1)
        query = str(request.url.query)
        redirect_url = f"{new_path}?{query}" if query else new_path
        return RedirectResponse(url=redirect_url, status_code=307)
    
    return await call_next(request)


# Routes
app.include_router(health.router, tags=["Health"])  # Keep health at root
app.include_router(api_v1.router)  # All API routes under /api/v1
