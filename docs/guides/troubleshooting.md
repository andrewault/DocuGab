# Troubleshooting Guide

Common issues and solutions.

## Service Issues

### Backend won't start

**Symptoms**: Container exits immediately or shows errors

**Check logs**:
```bash
docker compose logs backend
```

**Common causes**:

1. **Database not ready**
   ```bash
   docker compose up -d db
   # Wait 10 seconds
   docker compose up -d backend
   ```

2. **Missing migrations**
   ```bash
   docker exec docugab-backend uv run alembic upgrade head
   ```

3. **Invalid SECRET_KEY**
   - Must be at least 32 characters
   - Check `.env` file

### Ollama not responding

**Symptoms**: Document processing fails, chat returns errors

**Check**:
```bash
docker compose logs ollama
docker exec docugab-ollama ollama list
```

**Solution**: Pull models manually
```bash
docker exec docugab-ollama ollama pull llama3.2
docker exec docugab-ollama ollama pull nomic-embed-text
```

### Database connection refused

**Symptoms**: Backend can't connect to PostgreSQL

**Check**:
```bash
docker compose ps db
```

**Solution**: Ensure database is healthy
```bash
docker compose up -d db
docker compose logs db
```

## Document Issues

### Document stuck on "processing"

**Cause**: Background task failed silently

**Check backend logs**:
```bash
docker compose logs backend | grep -i error
```

**Solutions**:
- Delete document and re-upload
- Check Ollama is running
- Check disk space

### Document shows "error" status

**Solution**: Click the document row to see error message in detail modal

**Common errors**:
- "No text content extracted" — File may be scanned image (OCR not supported)
- "Connection refused" — Ollama not running

## Auth Issues

### Can't log in with admin credentials

1. Check `.env` has correct values:
   ```env
   ADMIN_USERNAME=admin@example.com
   ADMIN_PASSWORD=yourpassword
   ```

2. Restart backend to trigger seeding:
   ```bash
   docker compose restart backend
   ```

3. Check if user exists:
   ```bash
   docker exec -it docugab-db psql -U docugab -c "SELECT email, role FROM users;"
   ```

### Token expired errors

**Cause**: Access token expired (15 min default)

**Solution**: Frontend should auto-refresh. If not:
- Clear localStorage
- Log in again

## Performance

### Chat responses are slow

**Causes**:
- First request loads model into memory (~10s)
- Insufficient RAM for Ollama

**Solutions**:
- Increase Docker memory limit
- Use smaller model: `llama3.2:1b`

### Database queries slow

**Check for missing indexes**:
```bash
docker exec -it docugab-db psql -U docugab -c "\di"
```

## Reset Everything

**Nuclear option** — deletes all data:

```bash
docker compose down -v
docker compose up -d
```
