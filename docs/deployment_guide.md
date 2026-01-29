# Multi-Tenant System Deployment Guide

## Overview

This guide covers deploying the DocuGab multi-tenant system to production with subdomain routing, security, and monitoring.

---

## 1. Environment Setup

### Production Environment Variables

#### Backend `.env`

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@db-host:5432/docugab_prod

# API Server
API_HOST=0.0.0.0
API_PORT=8007
CORS_ORIGINS=https://docutok.com,https://*.docutok.com

# Ollama (LLM)
OLLAMA_BASE_URL=http://ollama:11434
LLM_MODEL=llama3.2

# Security
JWT_SECRET_KEY=<strong-random-secret-generate-with-openssl>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Admin
ADMIN_EMAIL=admin@docutok.com
ADMIN_PASSWORD=<strong-admin-password>

# Google TTS (if using)
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json
TTS_VOICE=en-US-Neural2-F

# Environment
ENVIRONMENT=production
```

#### Frontend `.env.production`

```bash
VITE_API_BASE_URL=https://api.docutok.com
```

---

## 2. DNS Configuration

### Wildcard Subdomain Setup

**Goal**: Route all subdomains (e.g., `acme.docutok.com`, `client1.docutok.com`) to your application.

#### Option A: AWS Route 53

1. Create hosted zone for `docutok.com`
2. Add A record:
   ```
   Name: *.docutok.com
   Type: A
   Value: <your-server-ip>
   ```
3. Add A record for apex:
   ```
   Name: docutok.com
   Type: A
   Value: <your-server-ip>
   ```
4. Add A record for API:
   ```
   Name: api.docutok.com
   Type: A
   Value: <your-backend-server-ip>
   ```

#### Option B: Cloudflare

1. Add domain to Cloudflare
2. DNS Records:
   - `A` record: `@` → `<server-ip>` (proxied ☁️)
   - `A` record: `*` → `<server-ip>` (proxied ☁️)
   - `A` record: `api` → `<backend-ip>` (proxied ☁️)

---

## 3. SSL/TLS Certificates

### Wildcard Certificate

You need a **wildcard SSL certificate** to cover all subdomains.

#### Option A: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Get wildcard cert (requires DNS verification)
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  -d docutok.com \
  -d *.docutok.com

# Follow prompts to add TXT records to DNS
# Certificate will be at: /etc/letsencrypt/live/docutok.com/
```

#### Option B: Cloudflare (Automatic)

If using Cloudflare, SSL is automatic:
- Set SSL/TLS to "Full (strict)"
- Wildcard cert is provided by Cloudflare

---

## 4. Database Migration

### Pre-Deployment

1. **Backup production database** (if exists):
   ```bash
   pg_dump -h db-host -U user docugab_prod > backup_$(date +%Y%m%d).sql
   ```

2. **Run migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Verify schema**:
   ```bash
   psql -h db-host -U user docugab_prod
   \dt  # List tables
   \d documents  # Check documents has project_id
   ```

### Data Migration (if needed)

If you have existing documents without `project_id`:

```sql
-- Create a default project for orphaned documents
INSERT INTO projects (
    customer_id, 
    name, 
    slug, 
    subdomain, 
    title, 
    color_primary, 
    color_secondary, 
    color_background, 
    avatar, 
    voice,
    is_active
) VALUES (
    1,  -- Assumes customer_id 1 exists
    'Legacy Documents',
    'legacy',
    'legacy',
    'Legacy System',
    '#1976d2',
    '#dc004e',
    '#ffffff',
    '/assets/avatars/default.glb',
    'en-US-Neural2-F',
    TRUE
) RETURNING id;

-- Update orphaned documents
UPDATE documents 
SET project_id = <returned-id>
WHERE project_id IS NULL;
```

---

## 5. Docker Deployment

### docker-compose.production.yml

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: docugab
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: docugab_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    restart: always
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql+asyncpg://docugab:${DB_PASSWORD}@postgres:5432/docugab_prod
      - OLLAMA_BASE_URL=http://ollama:11434
    env_file:
      - ./backend/.env.production
    volumes:
      - ./uploads:/app/uploads
      - ./credentials:/app/credentials:ro
    depends_on:
      - postgres
      - ollama
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_BASE_URL=https://api.docutok.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    restart: always

volumes:
  postgres_data:
  ollama_data:
```

### Backend Dockerfile.prod

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations on startup, then start server
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8007
```

### Frontend Dockerfile.prod

```dockerfile
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production nginx server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Wildcard subdomain support
    server {
        listen 80;
        listen 443 ssl;
        server_name docutok.com *.docutok.com;

        ssl_certificate /etc/letsencrypt/live/docutok.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/docutok.com/privkey.pem;

        root /usr/share/nginx/html;
        index index.html;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api {
            proxy_pass http://backend:8007;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Subdomain $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

---

## 6. Deployment Steps

### Initial Deployment

```bash
# 1. Clone repository
git clone https://github.com/yourorg/docugab.git
cd docugab

# 2. Set environment variables
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
# Edit both files with production values

# 3. Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# 4. Initialize Ollama model
docker exec -it docugab-ollama-1 ollama pull llama3.2

# 5. Verify deployment
curl https://api.docutok.com/health
curl https://docutok.com

# 6. Create admin user (if not auto-created)
docker exec -it docugab-backend-1 python -m app.scripts.create_admin
```

### Updating Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# Run any new migrations
docker exec -it docugab-backend-1 alembic upgrade head
```

---

## 7. Monitoring & Logging

### Health Checks

Add to `backend/app/api/routes/health.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Test DB connection
        await db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
```

### Logging

Add structured logging:

```python
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/docugab/app.log')
    ]
)

logger = logging.getLogger(__name__)
```

### Monitoring Services

**Option A: Self-hosted (Prometheus + Grafana)**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

**Option B: Cloud (Sentry)**

```python
# backend/app/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="https://your-sentry-dsn",
    environment="production",
    traces_sample_rate=0.1,
)
```

---

## 8. Backup Strategy

### Database Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec docugab-postgres-1 pg_dump -U docugab docugab_prod \
  > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://your-bucket/backups/
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 9. Scaling Considerations

### Horizontal Scaling

For high traffic:

1. **Load Balancer**: Use nginx, HAProxy, or cloud load balancer
2. **Multiple Backend Instances**: Scale FastAPI horizontally
3. **Database Read Replicas**: For read-heavy workloads
4. **CDN**: CloudFlare or CloudFront for static assets

### Performance Optimization

- Enable postgres connection pooling (already configured in SQLAlchemy)
- Cache frequently accessed project configs (Redis)
- Optimize vector search queries
- Monitor slow queries

---

## 10. Security Checklist

- [ ] SSL/TLS enabled (wildcard cert)
- [ ] Strong JWT secret (generate with `openssl rand -hex 32`)
- [ ] Strong admin password
- [ ] Database credentials secured
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (add middleware)
- [ ] SQL injection protection (using SQLAlchemy ORM ✓)
- [ ] XSS protection (Content Security Policy headers)
- [ ] Regular security updates
- [ ] Backup strategy in place

---

## 11. Post-Deployment Verification

### Checklist

- [ ] Main domain accessible (https://docutok.com)
- [ ] Admin panel works (/admin/customers, /admin/projects)
- [ ] Create test customer via admin
- [ ] Create test project with subdomain `test`
- [ ] Access branded page: https://test.docutok.com
- [ ] Verify branding applied correctly
- [ ] Upload document to test project
- [ ] Chat with document
- [ ] Verify no errors in logs
- [ ] Health check returns healthy: https://api.docutok.com/health
- [ ] SSL certificate valid (check browser)
- [ ] Monitoring dashboards showing data

---

## 12. Troubleshooting

### Common Issues

**Issue**: Subdomain not routing correctly
- Check DNS propagation: `dig test.docutok.com`
- Verify nginx wildcard config
- Check `X-Subdomain` header in backend

**Issue**: 502 Bad Gateway
- Check backend service: `docker logs docugab-backend-1`
- Verify database connection
- Check Ollama is running

**Issue**: Database connection failed
- Verify DATABASE_URL
- Check postgres service: `docker ps`
- Test connection: `psql -h localhost -U docugab docugab_prod`

**Issue**: Documents not uploading
- Check uploads directory permissions
- Verify PROJECT_ID is being sent
- Check backend logs for errors

---

## Support

For issues, consult:
- Application logs: `docker logs docugab-backend-1`
- Database logs: `docker logs docugab-postgres-1`
- Nginx logs: `docker logs docugab-frontend-1`

**Emergency Rollback**:
```bash
# Restore database backup
docker exec -i docugab-postgres-1 psql -U docugab docugab_prod \
  < /backups/db_backup_YYYYMMDD.sql

# Restart with previous version
git checkout <previous-commit>
docker-compose -f docker-compose.production.yml up -d --build
```
