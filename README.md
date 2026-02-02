# DocuTok

Transform your documents into intelligent conversations using local AI.

DocuTok is a RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask questions about them. All AI processing runs locally using Ollama—no API keys required, your data stays private.

![DocuTok](docs/screenshot.png)

## Features

- 📄 **Multi-format Support** — Upload PDF, DOCX, TXT, and Markdown files
- 🔍 **Semantic Search** — Find relevant content using vector similarity (pgvector)
- 💬 **Natural Conversations** — Ask questions in plain English
- 📌 **Source Citations** — Every answer links back to the exact source
- 🔒 **100% Local** — All AI runs on your machine via Ollama
- 🐳 **Fully Dockerized** — One command to start everything

## Docker Architecture

DocuTok uses a **multi-container Docker Compose setup** for simplified deployment and development. All services (except Ollama) run in Docker containers with automatic health checks and dependency management.

### Container Overview

The application consists of **5 Docker services**:

```
┌─────────────────────────────────────────────────────┐
│                    Host Machine                      │
│  ┌────────────┐                                      │
│  │   Ollama   │ Native app (GPU acceleration)       │
│  │ :11434     │ Models: nomic-embed-text, llama3.2  │
│  └─────▲──────┘                                      │
│        │                                             │
│  ┌─────┴──────────────────────────────────────────┐ │
│  │           Docker Compose Network               │ │
│  │                                                 │ │
│  │  ┌──────────────┐      ┌──────────────┐       │ │
│  │  │   Frontend   │◀─────│   Backend    │       │ │
│  │  │  React/Vite  │      │   FastAPI    │       │ │
│  │  │   :5177      │      │    :8007     │       │ │
│  │  └──────────────┘      └───────┬──────┘       │ │
│  │                                 │              │ │
│  │  ┌──────────────┐      ┌───────▼──────┐       │ │
│  │  │    Redis     │◀─────│    Celery    │       │ │
│  │  │   :6379      │      │   Worker     │       │ │
│  │  └──────────────┘      └───────┬──────┘       │ │
│  │                                 │              │ │
│  │  ┌──────────────────────────────▼──────┐      │ │
│  │  │          PostgreSQL + pgvector       │      │ │
│  │  │              :5432 → :5433           │      │ │
│  │  └──────────────────────────────────────┘      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Service Details

| Service | Container Name | Image | Port Mapping | Purpose |
|---------|----------------|-------|--------------|---------|
| **db** | `docutok-db` | `pgvector/pgvector:pg16` | `5433:5432` | PostgreSQL with vector similarity search |
| **redis** | `docutok-redis` | `redis:7-alpine` | `6379:6379` | Cache and message broker for Celery |
| **backend** | `docutok-backend` | Built from `backend/Dockerfile` | `8007:8007` | FastAPI server with RAG pipeline |
| **celery_worker** | `docutok-celery` | Built from `backend/Dockerfile` | - | Background task processing |
| **frontend** | `docutok-frontend` | Built from `frontend/Dockerfile` | `5177:5177` | React UI with Vite dev server |

### Why Ollama Runs Natively

**Ollama runs on the host** (not in Docker) to leverage **GPU acceleration** (Metal on Mac, CUDA on Linux). This provides:
- ⚡ **10-50x faster inference** compared to CPU-only Docker
- 🎯 **Direct GPU access** for embeddings and LLM generation
- 💾 **Shared model cache** across projects

The backend container connects to Ollama via `host.docker.internal:11434`.

### Health Checks and Dependencies

All services have **health checks** to ensure proper startup ordering:

```yaml
# PostgreSQL: Checks if database accepts connections
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U docutok"]
  interval: 5s
  
# Redis: Pings Redis server
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
```

**Startup Sequence:**
1. `db` and `redis` start and wait until healthy
2. `backend` starts after db + redis are healthy
   - Runs migrations: `alembic upgrade head`
   - Starts FastAPI server with auto-reload
3. `celery_worker` starts after db + redis are healthy
4. `frontend` starts after backend is up

### Volume Mounts

**Persistent Data:**
- `postgres_data:/var/lib/postgresql/data` — Database files
- `redis_data:/data` — Redis persistence (AOF enabled)

**Development Bind Mounts:**
- `./backend:/app` — Backend hot reload
- `./frontend:/app` — Frontend hot reload
- `./uploads:/app/uploads` — Uploaded documents
- `./credentials:/app/credentials:ro` — Google Cloud credentials (read-only)
- `./dbbackups:/app/dbbackups` — Database backup directory

### Environment Variables

All configuration is managed via the root `.env` file and injected into containers:

**Backend:**
- `DATABASE_URL` — Connection to PostgreSQL (with async support)
- `OLLAMA_BASE_URL` — Points to `host.docker.internal:11434`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` — Redis connections
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — Initial superadmin user
- Model settings, ports, secrets, etc.

**Frontend:**
- `VITE_API_BASE_URL` — Backend API endpoint
- `VITE_PORT` — Dev server port

### Management Scripts

| Script | Purpose |
|--------|---------|
| `scripts/webapp/start.sh` | Start all services + Ollama |
| `scripts/webapp/stop.sh` | Stop all services |
| `scripts/webapp/restart.sh` | Restart services (preserves data) |
| `scripts/webapp/health.sh` | Check service health status |
| `scripts/webapp/ollama-pull-models.sh` | Download AI models |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Material UI |
| Backend | FastAPI, SQLAlchemy 2.0 |
| Database | PostgreSQL + pgvector |
| AI/ML | Ollama, LangChain |
| Embeddings | nomic-embed-text (768 dim) |
| LLM | llama3.2 |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- ~3GB disk space for AI models

### 1. Start Services

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/DocuTok.git
cd DocuTok

# Start all services
docker compose up -d

# Pull AI models (first time only, ~2.3GB)
./scripts/webapp/pull-models.sh
```

### 2. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5177 |
| Backend API | http://localhost:8007 |
| API Docs | http://localhost:8007/docs |

### 3. Upload a Document

1. Click **Upload Document** on the home page
2. Drag & drop or click to select a file
3. Wait for processing (status shows "ready" when complete)

### 4. Start Chatting

1. Click **Start Chatting**
2. Ask questions about your documents
3. Responses include source citations

## Project Structure

```
DocuTok/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Config, database
│   │   ├── models/          # SQLAlchemy models
│   │   └── services/        # RAG pipeline
│   ├── alembic/             # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   └── pages/           # Page components
│   └── Dockerfile
├── scripts/webapp/          # Management scripts
├── docker-compose.yml
└── .env                     # Configuration
```

## Configuration

All configuration is in the root `.env` file:

```env
# Ports
BACKEND_PORT=8007
VITE_PORT=5177

# Database
POSTGRES_USER=docutok
POSTGRES_PASSWORD=docutok_secret
POSTGRES_DB=docutok

# Initial Admin User
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=admin123

# AI Models
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/` | List all documents |
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents/{id}` | Get document details |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/chat/` | Streaming chat |
| POST | `/api/chat/query` | Non-streaming chat |

## Development

### Local Development (without Docker)

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

### Database Migrations

```bash
cd backend

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head
```

### Useful Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop all services
docker compose down

# Rebuild containers
docker compose up -d --build
```

## Database Access

Connect to the PostgreSQL database for debugging or data inspection:

```bash
# Access psql shell inside container
docker exec -it docutok-db psql -U docutok -d docutok

# Common queries
\dt                          # List all tables
\d users                     # Describe users table
SELECT * FROM users;         # View all users
SELECT * FROM documents;     # View all documents
SELECT COUNT(*) FROM chunks; # Count embedded chunks
\q                           # Quit
```

### Direct Connection

Connect from your host machine (requires PostgreSQL client):

```bash
psql -h localhost -p 5432 -U docutok -d docutok
```

### Reset Database

```bash
# Stop services and delete volume (⚠️ destroys all data)
docker compose down -v
docker compose up -d

# Re-run migrations
docker exec docutok-backend uv run alembic upgrade head
```

## Troubleshooting

### Ollama models not loading

```bash
# Check if Ollama is running
curl http://localhost:11434/

# Re-pull models
docker exec docutok-ollama ollama pull nomic-embed-text
docker exec docutok-ollama ollama pull llama3.2
```

### Database connection issues

```bash
# Check if PostgreSQL is healthy
docker compose ps

# View database logs
docker compose logs db
```

### Frontend not updating

```bash
# Restart frontend container
docker compose restart frontend
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
