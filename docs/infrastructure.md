# Infrastructure

## Overview

DocuGab (DocuTok) uses a fully containerized Docker-based architecture with local Python dependency management via `uv`.

## Core Technologies

### Docker

All services run in Docker containers orchestrated via Docker Compose:

- **Backend** — FastAPI application in a Python 3.12 container
- **Frontend** — React/Vite application with Node.js build environment
- **Database** — PostgreSQL with pgvector extension
- **AI/ML** — Ollama for local LLM and embedding models

See [`docker-compose.yml`](file:///Users/andrewault/dev/ault/DocuGab/docker-compose.yml) for the complete service configuration.

### PostgreSQL with pgvector

The database runs in a Docker container with the following configuration:

- **Image**: `pgvector/pgvector:pg16`
- **Port**: `5432` (host) → `5432` (container)
- **Extensions**: `pgvector` for vector similarity search
- **Usage**: Stores user data, documents, and 768-dimensional embeddings

Vector embeddings are generated using Ollama's `nomic-embed-text` model and stored in the `chunks` table with pgvector's `vector` type for semantic search.

### uv (Python Package Manager)

The backend uses [`uv`](https://github.com/astral-sh/uv) for fast, deterministic Python dependency management:

- **Lock file**: [`pyproject.toml`](file:///Users/andrewault/dev/ault/DocuGab/backend/pyproject.toml) and `uv.lock`
- **Local development**: `uv sync` to install dependencies
- **Running commands**: `uv run <command>` (e.g., `uv run uvicorn`, `uv run alembic`)
- **Docker**: Dependencies are installed during image build using `uv sync --frozen`

#### Common uv Commands

```bash
# Install/sync dependencies
uv sync

# Run the backend server
uv run uvicorn app.main:app --reload --port 8007

# Run database migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Add a new dependency
uv add <package-name>
```

## Service Orchestration

All services are managed through Docker Compose:

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart backend

# Stop all services
docker compose down

# Rebuild containers
docker compose up -d --build
```

## Development Workflow

### Running Locally (with Docker)

```bash
docker compose up -d
```

### Running Locally (without Docker)

Requires PostgreSQL with pgvector and Ollama installed locally:

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8007

# Frontend
cd frontend
npm install
npm run dev
```

## Database Management

See [Database Access section in README](file:///Users/andrewault/dev/ault/DocuGab/README.md#database-access) for connection details and commands.
