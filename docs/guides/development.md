# Development Guide

Set up a local development environment for DocuTok.

## Prerequisites

- Docker Desktop
- Node.js 18+
- Python 3.12+ with `uv`

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▸│   Backend   │────▸│  PostgreSQL │
│   (Vite)    │     │  (FastAPI)  │     │  + pgvector │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Ollama    │
                    │  (Local AI) │
                    └─────────────┘
```

## Setup

### 1. Start Infrastructure

```bash
docker compose up -d db ollama
```

### 2. Backend (Terminal 1)

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8007
```

### 3. Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

## Hot Reload

| Service | Hot Reload | How |
|---------|------------|-----|
| Frontend | ✅ Yes | Vite HMR |
| Backend | ✅ Yes | Uvicorn `--reload` |
| Database | N/A | Schema via migrations |

## Database Migrations

```bash
cd backend

# Create migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one
uv run alembic downgrade -1
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required
SECRET_KEY=minimum-32-character-string-here
DATABASE_URL=postgresql+asyncpg://docutok:docutok@localhost:5432/docutok

# Optional
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=admin123
```

## Code Quality

```bash
# Backend
cd backend
uv run ruff check .
uv run mypy .

# Frontend
cd frontend
npm run lint
npm run type-check
```

## Useful Commands

```bash
# View backend logs
docker compose logs -f backend

# Access database
docker exec -it docutok-db psql -U docutok

# Pull latest AI models
docker exec docutok-ollama ollama pull llama3.2
docker exec docutok-ollama ollama pull nomic-embed-text
```
