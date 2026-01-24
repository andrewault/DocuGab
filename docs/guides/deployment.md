# Deployment Guide

Deploy DocuGab to production.

## Requirements

- Server with Docker and Docker Compose
- At least 8GB RAM (for Ollama models)
- Domain name (optional, for HTTPS)

## Production Configuration

### 1. Environment Variables

Create `.env` from `.env.example`:

```env
# Security - CHANGE THESE
SECRET_KEY=generate-a-very-long-random-string-at-least-64-chars
ADMIN_USERNAME=admin@yourcompany.com
ADMIN_PASSWORD=secure-password-here

# Database
POSTGRES_USER=docugab
POSTGRES_PASSWORD=strong-db-password
POSTGRES_DB=docugab

# API URL (for frontend)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Generate Secret Key

```bash
openssl rand -hex 32
```

### 3. Deploy

```bash
docker compose -f docker-compose.yml up -d
```

## Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name docugab.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api/ {
        proxy_pass http://localhost:8007/api/;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        
        # SSE streaming support
        proxy_buffering off;
        proxy_cache off;
    }
}
```

## Backups

### Database

```bash
docker exec docugab-db pg_dump -U docugab docugab > backup.sql
```

### Restore

```bash
cat backup.sql | docker exec -i docugab-db psql -U docugab docugab
```

### Uploaded Files

```bash
tar -czf uploads-backup.tar.gz uploads/
```

## Monitoring

```bash
# Service health
docker compose ps

# Logs
docker compose logs -f --tail 100

# Resource usage
docker stats
```

## Updates

```bash
git pull
docker compose build
docker compose up -d

# Run new migrations
docker exec docugab-backend uv run alembic upgrade head
```

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Change default database password
- [ ] Enable HTTPS via reverse proxy
- [ ] Configure firewall (only expose 80/443)
- [ ] Set up automated backups
- [ ] Review CORS settings for production domain
