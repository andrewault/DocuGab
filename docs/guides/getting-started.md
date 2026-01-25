# Getting Started

Get DocuTok running and upload your first document.

## Prerequisites

- Docker Desktop installed and running
- Git

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/docutok.git
cd docutok

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Wait for services to be healthy (~30 seconds first time)
docker compose ps
```

## Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8007 |
| API Docs | http://localhost:8007/docs |

## First Steps

### 1. Create an Account

1. Go to http://localhost:5173
2. Click **Register**
3. Enter email and password
4. You're logged in!

### 2. Upload a Document

1. Click **Documents** in navbar
2. Click **Upload** button
3. Select a PDF, DOCX, TXT, or MD file
4. Wait for status to change to "Ready"

### 3. Chat with Your Documents

1. Click **Chat** in navbar
2. Type a question about your document
3. View the AI response with source citations

## Initial Admin User

To create an admin account on first startup, edit `.env`:

```env
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

Then restart:

```bash
docker compose restart backend
```

## Stopping Services

```bash
docker compose down
```

Data persists in Docker volumes. To fully reset:

```bash
docker compose down -v
```
