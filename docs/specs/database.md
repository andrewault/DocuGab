# Database Specification

## Overview

PostgreSQL with pgvector extension for vector similarity search.

## Connection

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| URL | - | `DATABASE_URL` |
| Host port | 5433 | `DB_HOST_PORT` |
| Internal port | 5432 | `POSTGRES_PORT` |

## Tables

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | |
| avatar_url | VARCHAR(500) | |
| role | VARCHAR(50) | DEFAULT 'user' |
| is_active | BOOLEAN | DEFAULT true |
| is_verified | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FK → users(id) CASCADE |
| refresh_token | VARCHAR(500) | NOT NULL |
| expires_at | TIMESTAMPTZ | NOT NULL |
| is_revoked | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### documents

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| filename | VARCHAR(255) | NOT NULL |
| original_filename | VARCHAR(255) | NOT NULL |
| content_type | VARCHAR(100) | NOT NULL |
| file_size | INTEGER | NOT NULL |
| status | VARCHAR(50) | DEFAULT 'pending' |
| error_message | TEXT | |
| user_id | INTEGER | FK → users(id) CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### chunks

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| document_id | INTEGER | FK → documents(id) CASCADE |
| content | TEXT | NOT NULL |
| page_number | INTEGER | NOT NULL |
| chunk_index | INTEGER | NOT NULL |
| embedding | VECTOR(768) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Indexes

- `users.email` — unique index
- `documents.user_id` — foreign key index
- `chunks.document_id` — foreign key index
- `chunks.embedding` — vector index (ivfflat or hnsw)

## Cascade Deletes

| Parent | Child | Behavior |
|--------|-------|----------|
| users | documents | CASCADE |
| users | sessions | CASCADE |
| documents | chunks | CASCADE |

## Access from Host

```bash
# Via Docker
docker exec -it docugab-db psql -U docugab -d docugab

# Direct connection
psql -h localhost -p 5433 -U docugab -d docugab
```
