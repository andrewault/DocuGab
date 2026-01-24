# DocuTalk Webapp Scripts

Scripts for managing the DocuTalk web application services.

## Prerequisites

- Node.js and npm (for frontend)
- Python 3.12 and uv (for backend)
- Docker (for PostgreSQL and Ollama)

## Configuration

All scripts read ports from the project root `.env` file:

```env
BACKEND_PORT=8007
VITE_PORT=5177
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2
```

## Scripts

### start.sh

Start all webapp services (frontend + backend).

```bash
./scripts/webapp/start.sh
```

This will:
- Start the FastAPI backend on `BACKEND_PORT`
- Start the Vite dev server on `VITE_PORT`
- Create log files in `logs/`
- Store PIDs for clean shutdown

### stop.sh

Stop all webapp services.

```bash
./scripts/webapp/stop.sh
```

This will:
- Stop services using stored PIDs
- Fall back to port-based termination if needed

### restart.sh

Restart all services.

```bash
./scripts/webapp/restart.sh
```

### health.sh

Check the health of all services.

```bash
./scripts/webapp/health.sh
```

This checks:
- Backend port availability
- Backend `/health` endpoint
- Backend `/health/db` database connectivity
- Frontend port availability
- Docker PostgreSQL container status

### pull-models.sh

Pull required AI models into the Ollama Docker container.

```bash
./scripts/webapp/pull-models.sh
```

This will:
- Start Ollama container if not running
- Pull the embedding model (nomic-embed-text)
- Pull the LLM model (llama3.2)

**Note:** This must be run once after first Docker setup.

## Logs

When started via `start.sh`, logs are written to:

- `logs/backend.log` - FastAPI uvicorn output
- `logs/frontend.log` - Vite dev server output

## Docker Services

All services (database, Ollama, backend, frontend) can run in Docker.

### Start All Services

```bash
# Start everything
docker compose up -d

# Pull AI models (first-time only)
./scripts/webapp/pull-models.sh

# View logs
docker compose logs -f
```

### Start Individual Services

```bash
# Database only
docker compose up -d db

# Ollama only
docker compose up -d ollama

# Backend + dependencies
docker compose up -d backend

# All services
docker compose up -d
```

### Stop All Services

```bash
docker compose down
```

## Quick Reference

| Service | Container | Port | URL |
|---------|-----------|------|-----|
| Frontend | docutalk-frontend | 5177 | http://localhost:5177 |
| Backend API | docutalk-backend | 8007 | http://localhost:8007 |
| Swagger Docs | docutalk-backend | 8007 | http://localhost:8007/docs |
| PostgreSQL | docutalk-db | 5432 | localhost:5432 |
| Ollama | docutalk-ollama | 11434 | http://localhost:11434 |
