# Documents Specification

## Overview

Document ingestion pipeline: upload → extract → chunk → embed → store.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/` | List all documents |
| GET | `/api/documents/{id}` | Get document details |
| POST | `/api/documents/upload` | Upload new document |
| DELETE | `/api/documents/{id}` | Delete document and file |

## Supported Formats

| Extension | MIME Type | Extraction Method |
|-----------|-----------|-------------------|
| `.pdf` | application/pdf | PyPDF2 |
| `.docx` | application/vnd.openxmlformats... | python-docx |
| `.txt` | text/plain | Direct read |
| `.md` | text/markdown | Direct read |

## Document Model

```python
class Document:
    id: int
    filename: str            # UUID-based stored filename
    original_filename: str   # User's original filename
    content_type: str        # MIME type
    file_size: int           # Bytes
    status: str              # pending | processing | ready | error
    error_message: str | None
    user_id: int | None      # Owner (FK to users)
    created_at: datetime
    updated_at: datetime
```

## Status Lifecycle

```
pending → processing → ready
                    ↘ error
```

| Status | Description |
|--------|-------------|
| pending | Uploaded, awaiting processing |
| processing | Text extraction and embedding in progress |
| ready | Successfully processed, available for chat |
| error | Processing failed, see error_message |

## Chunking Configuration

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Chunk size | 500 chars | `CHUNK_SIZE` |
| Chunk overlap | 50 chars | `CHUNK_OVERLAP` |

## Storage

- **Location**: `backend/uploads/`
- **Naming**: `{uuid}.{ext}` (e.g., `a1b2c3d4-5678-90ab.pdf`)
- **Volume mount**: `./uploads:/app/uploads` in Docker

## Processing Pipeline

1. **Save file** to uploads directory
2. **Create document** record (status: pending)
3. **Background task**:
   - Extract text from file
   - Split into overlapping chunks
   - Generate embeddings via Ollama
   - Store chunks with vectors in database
   - Update status to ready (or error)

## Delete Behavior

When a document is deleted:
1. Physical file removed from disk
2. Document record deleted
3. All chunks cascade deleted (including embeddings)
