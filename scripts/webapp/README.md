# Webapp Scripts

Scripts for managing the DocuGab Docker application.

## Usage

```bash
./scripts/webapp/start.sh     # Start all services
./scripts/webapp/stop.sh      # Stop all services
./scripts/webapp/restart.sh   # Restart all services
./scripts/webapp/health.sh    # Check service health
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5177 | React app |
| Backend | 8007 | FastAPI server |
| Database | 5433 | PostgreSQL + pgvector |
| Ollama | 11434 | Local AI models |

## URLs

After starting:
- **App**: http://localhost:5177
- **API**: http://localhost:8007
- **API Docs**: http://localhost:8007/docs

## Data Persistence

Data is stored in Docker volumes:
- `postgres_data` — Database
- `ollama_data` — AI models

To reset all data:
```bash
docker compose down -v
```
