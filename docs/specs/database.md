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
| last_login_at | TIMESTAMPTZ | |

### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FK → users(id) CASCADE |
| refresh_token | VARCHAR(500) | UNIQUE, NOT NULL |
| device_info | VARCHAR(255) | |
| ip_address | VARCHAR(45) | |
| expires_at | TIMESTAMPTZ | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### documents

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| uuid | UUID | UNIQUE, NOT NULL, DEFAULT uuid4() |
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
| page_number | INTEGER | |
| chunk_index | INTEGER | NOT NULL |
| embedding | VECTOR(768) | |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### chat_messages

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FK → users(id) CASCADE |
| session_id | UUID | NOT NULL |
| role | VARCHAR(20) | NOT NULL |
| content | TEXT | NOT NULL |
| document_filter_id | INTEGER | FK → documents(id) SET NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### faqs

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| question | VARCHAR(500) | NOT NULL |
| answer | TEXT | NOT NULL |
| order | INTEGER | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Indexes

- `users.email` — unique index
- `users.id` — primary key index
- `documents.uuid` — unique index
- `documents.user_id` — foreign key
- `chunks.document_id` — foreign key
- `sessions.refresh_token` — unique index
- `chat_messages.user_id` — foreign key
- `chat_messages.session_id` — index
- `faqs.id` — primary key

## Cascade Deletes

| Parent | Child | Behavior |
|--------|-------|----------|
| users | documents | CASCADE |
| users | sessions | CASCADE |
| users | chat_messages | CASCADE |
| documents | chunks | CASCADE |

## Access from Host

```bash
# Via Docker
docker exec -it docutok-db psql -U docutok -d docutok

# Direct connection
psql -h localhost -p 5433 -U docutok -d docutok
```
