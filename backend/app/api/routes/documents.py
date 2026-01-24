from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Document
from app.services.storage import save_uploaded_file
from app.services.processor import process_document


router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all uploaded documents with their status."""
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "status": doc.status,
                "file_size": doc.file_size,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            }
            for doc in documents
        ]
    }


@router.get("/{document_id}")
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific document by ID."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": document.id,
        "filename": document.original_filename,
        "status": document.status,
        "file_size": document.file_size,
        "content_type": document.content_type,
        "created_at": document.created_at.isoformat() if document.created_at else None,
    }


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document and trigger async processing."""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Save file to disk
    stored_filename, original_filename = await save_uploaded_file(file)
    
    # Get file size
    file_size = file.size or 0
    
    # Create document record
    document = Document(
        filename=stored_filename,
        original_filename=original_filename,
        content_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        status="pending"
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Trigger background processing
    # Note: We need a new session for background task
    background_tasks.add_task(process_document_background, document.id)
    
    return {
        "id": document.id,
        "filename": original_filename,
        "status": "pending",
        "message": "Document uploaded. Processing started."
    }


async def process_document_background(document_id: int):
    """Background task to process document."""
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        try:
            await process_document(document_id, db)
        except Exception as e:
            # Log error but don't raise (background task)
            print(f"Error processing document {document_id}: {e}")


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document and its chunks."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted", "id": document_id}
