# DocuGab

Transform your documents into intelligent conversations using local AI.

DocuGab is a RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask questions about them. All AI processing runs locally using Ollama—no API keys required, your data stays private.

![DocuGab](docs/screenshot.png)

## Features

- 📄 **Multi-format Support** — Upload PDF, DOCX, TXT, and Markdown files
- 🔍 **Semantic Search** — Find relevant content using vector similarity (pgvector)
- 💬 **Natural Conversations** — Ask questions in plain English
- 📌 **Source Citations** — Every answer links back to the exact source
- 🔒 **100% Local** — All AI runs on your machine via Ollama
- 🐳 **Fully Dockerized** — One command to start everything

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
git clone https://github.com/YOUR_USERNAME/DocuGab.git
cd DocuGab

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
DocuGab/
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
POSTGRES_USER=docugab
POSTGRES_PASSWORD=docugab_secret
POSTGRES_DB=docugab

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
docker exec -it docugab-db psql -U docugab -d docugab

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
psql -h localhost -p 5432 -U docugab -d docugab
```

### Reset Database

```bash
# Stop services and delete volume (⚠️ destroys all data)
docker compose down -v
docker compose up -d

# Re-run migrations
docker exec docugab-backend uv run alembic upgrade head
```

## Troubleshooting

### Ollama models not loading

```bash
# Check if Ollama is running
curl http://localhost:11434/

# Re-pull models
docker exec docugab-ollama ollama pull nomic-embed-text
docker exec docugab-ollama ollama pull llama3.2
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
