# Backend: FastAPI + PostgreSQL + Docker Setup

## Overview

This plan establishes the backend infrastructure for DocuTalk using FastAPI with PostgreSQL as the primary database. Docker is used for containerization to ensure consistent development and deployment environments.

---

## Progress Tracking

| Phase | Task | Status |
|-------|------|--------|
| 1 | Initialize Python project with uv | ✅ Complete |
| 2 | Install FastAPI and dependencies | ✅ Complete |
| 3 | Configure PostgreSQL with pgvector | ✅ Complete |
| 4 | Create Docker Compose configuration | ✅ Complete |
| 5 | Set up SQLAlchemy models | ✅ Complete |
| 6 | Create initial API routes | ✅ Complete |
| 7 | Configure Alembic migrations | ✅ Complete |
| 8 | Verify Docker stack and health endpoints | ✅ Complete |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Phase 1: Initialize Python Project

Create the backend directory with `uv` for fast, reliable Python package management.

```bash
cd /Users/andrewault/dev/ault/DocuTok
mkdir backend && cd backend
uv init --python 3.12
```

**Expected structure:**
```
backend/
├── pyproject.toml
├── .python-version
└── README.md
```

---

## Phase 2: Install FastAPI and Dependencies

### Core Dependencies

```bash
cd backend
uv add fastapi uvicorn[standard]
uv add sqlalchemy[asyncio] asyncpg alembic
uv add pgvector
uv add python-multipart  # For file uploads
uv add pydantic-settings  # For environment config
uv add python-jose[cryptography] passlib[bcrypt]  # Auth (future)
```

### Development Dependencies

```bash
uv add --dev pytest pytest-asyncio httpx
uv add --dev ruff mypy
```

**Package purposes:**
- `fastapi` — Web framework with automatic OpenAPI docs
- `uvicorn[standard]` — ASGI server with hot reload
- `sqlalchemy[asyncio]` — Async ORM
- `asyncpg` — High-performance PostgreSQL driver
- `alembic` — Database migrations
- `pgvector` — Vector similarity search extension
- `pydantic-settings` — Type-safe environment configuration

---

## Phase 3: Configure PostgreSQL with pgvector

### 3.1 Docker PostgreSQL Image

Use the official `pgvector/pgvector` image which includes the vector extension pre-installed.

### 3.2 Environment Configuration

**File:** `backend/.env`

```env
# Database
DATABASE_URL=postgresql+asyncpg://docutalk:docutalk_secret@localhost:5432/docutalk

# API
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

**File:** `backend/.env.example`

```env
DATABASE_URL=postgresql+asyncpg://docutalk:docutalk_secret@localhost:5432/docutalk
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 3.3 Settings Module

**File:** `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # CORS
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
```

---

## Phase 4: Create Docker Compose Configuration

**File:** `docker-compose.yml` (project root)

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: docutalk-db
    environment:
      POSTGRES_USER: docutalk
      POSTGRES_PASSWORD: docutalk_secret
      POSTGRES_DB: docutalk
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docutalk"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: docutalk-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://docutalk:docutalk_secret@db:5432/docutalk
      CORS_ORIGINS: http://localhost:5173,http://localhost:5174
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
```

**File:** `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File:** `backend/.dockerignore`

```
__pycache__
*.pyc
.pytest_cache
.mypy_cache
.ruff_cache
.venv
.env
*.egg-info
```

---

## Phase 5: Set Up SQLAlchemy Models

### 5.1 Database Connection

**File:** `backend/app/core/database.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 5.2 Initial Models

**File:** `backend/app/models/__init__.py`

```python
from app.models.document import Document
from app.models.chunk import Chunk

__all__ = ["Document", "Chunk"]
```

**File:** `backend/app/models/document.py`

```python
from datetime import datetime
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int]
    status: Mapped[str] = mapped_column(String(50), default="pending")
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
```

**File:** `backend/app/models/chunk.py`

```python
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int | None]
    chunk_index: Mapped[int]
    
    # Vector embedding (1536 dimensions for OpenAI ada-002)
    embedding = mapped_column(Vector(1536), nullable=True)

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="chunks")
```

---

## Phase 6: Create Initial API Routes

### 6.1 Application Entry Point

**File:** `backend/app/main.py`

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="DocuTalk API",
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

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
```

### 6.2 Health Check Route

**File:** `backend/app/api/routes/health.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db


router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/health/db")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}
```

### 6.3 Documents Route (Placeholder)

**File:** `backend/app/api/routes/documents.py`

```python
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db


router = APIRouter()


@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db)):
    return {"documents": []}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # TODO: Implement file upload and processing
    return {
        "message": "Upload endpoint ready",
        "filename": file.filename,
        "content_type": file.content_type,
    }
```

### 6.4 Route Registration

**File:** `backend/app/api/routes/__init__.py`

```python
from app.api.routes import health, documents

__all__ = ["health", "documents"]
```

**File:** `backend/app/api/__init__.py`

```python
# API module
```

**File:** `backend/app/__init__.py`

```python
# App module
```

---

## Phase 7: Configure Alembic Migrations

### 7.1 Initialize Alembic

```bash
cd backend
uv run alembic init alembic
```

### 7.2 Configure Alembic

**File:** `backend/alembic/env.py` (key sections)

```python
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.core.config import settings
from app.core.database import Base
from app.models import *  # Import all models

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 7.3 Create Initial Migration

```bash
cd backend
uv run alembic revision --autogenerate -m "initial_schema"
uv run alembic upgrade head
```

---

## Phase 8: Verify Docker Stack

### 8.1 Start Services

```bash
# From project root
docker compose up -d

# Check logs
docker compose logs -f backend
```

### 8.2 Verify Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/health/db

# API docs
open http://localhost:8000/docs
```

### 8.3 Verification Checklist

- [ ] PostgreSQL container running with pgvector extension
- [ ] Backend container connects to database
- [ ] `/health` returns `{"status": "healthy"}`
- [ ] `/health/db` returns `{"status": "healthy", "database": "connected"}`
- [ ] Swagger UI accessible at `/docs`
- [ ] Migrations applied successfully

---

## Directory Structure

```
backend/
├── alembic/
│   ├── versions/
│   └── env.py
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py
│   │       └── documents.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── document.py
│   │   └── chunk.py
│   ├── __init__.py
│   └── main.py
├── Dockerfile
├── .dockerignore
├── .env
├── .env.example
├── pyproject.toml
└── alembic.ini
```

---

## Recommendations

### Immediate Next Steps

1. **Add Pydantic Schemas** — Create `app/schemas/` for request/response validation
2. **Implement Repository Pattern** — Add `app/repositories/` for database operations
3. **Configure Logging** — Set up structured logging with `structlog` or `loguru`

### Security Best Practices

1. **Secrets Management** — Use Docker secrets or a vault in production
2. **Rate Limiting** — Add `slowapi` for API rate limiting
3. **Input Validation** — Leverage Pydantic for strict input validation
4. **SQL Injection** — SQLAlchemy ORM prevents injection; avoid raw SQL

### Performance Considerations

1. **Connection Pooling** — Configure SQLAlchemy pool settings for production
2. **Async Everywhere** — Use async endpoints and database operations
3. **Redis Cache** — Add Redis for caching frequent queries

### Production Readiness

1. **Health Checks** — Already implemented for container orchestration
2. **Graceful Shutdown** — Handle SIGTERM in lifespan context
3. **Environment Separation** — Use different `.env` files per environment
4. **CI/CD Pipeline** — Add GitHub Actions for testing and deployment
