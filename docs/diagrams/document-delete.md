# Document Delete Flow

This document details what happens when a document is deleted in DocuTok.

## Delete Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant FS as File System

    U->>FE: Click delete button
    FE->>FE: Confirm dialog
    U->>FE: Confirm
    FE->>BE: DELETE /api/documents/{id}
    
    BE->>DB: Get document
    alt Document not found
        BE-->>FE: 404 Not Found
        FE-->>U: Show error
    else Document exists
        BE->>DB: DELETE document
        Note over DB: CASCADE triggers
        DB->>DB: Delete all chunks
        DB->>DB: Delete vector embeddings
        DB-->>BE: Commit success
        BE-->>FE: 200 OK
        FE->>FE: Remove from list
        FE-->>U: Show success
    end
```

## Cascade Delete Chain

```mermaid
flowchart TD
    subgraph Trigger["User Action"]
        A[Delete Document]
    end
    
    subgraph API["Backend API"]
        B[Delete physical file]
    end
    
    subgraph Database["PostgreSQL Cascade"]
        C[documents table]
        D[chunks table]
        E[Vector embeddings]
    end
    
    A --> B
    B --> C
    C -->|"ON DELETE CASCADE"| D
    D -->|"Part of chunks row"| E
    
    style A fill:#ff6b6b
    style B fill:#ffa94d
    style C fill:#ffd43b
    style D fill:#69db7c
    style E fill:#69db7c
```

## What Gets Deleted

| Resource | Deleted? | Method |
|----------|----------|--------|
| Physical file | ✅ Yes | `file_path.unlink()` |
| Document record | ✅ Yes | Direct delete |
| All chunks | ✅ Yes | Foreign key cascade |
| Vector embeddings | ✅ Yes | Part of chunk rows |

## Code Reference

```python
# backend/app/api/routes/documents.py

@router.delete("/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document, its chunks, and the physical file."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete physical file
    file_path = get_file_path(document.filename)
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database (cascades to chunks)
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted", "id": document_id}
```

## Chunk Cascade Configuration

```python
# backend/app/models/document.py

chunks: Mapped[list["Chunk"]] = relationship(
    back_populates="document", 
    cascade="all, delete-orphan"  # ← Deletes chunks when document is deleted
)
```
