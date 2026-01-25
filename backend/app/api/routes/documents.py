from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Document
from app.services.storage import save_uploaded_file, get_file_path
from app.services.processor import process_document


router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


def document_to_dict(doc: Document) -> dict:
    """Convert document to API response dict."""
    return {
        "id": doc.id,
        "uuid": str(doc.uuid),
        "filename": doc.original_filename,
        "status": doc.status,
        "error_message": doc.error_message,
        "file_size": doc.file_size,
        "content_type": doc.content_type,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all uploaded documents with their status."""
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    
    return {
        "documents": [document_to_dict(doc) for doc in documents]
    }


@router.get("/by-uuid/{uuid}")
async def get_document_by_uuid(uuid: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific document by UUID."""
    result = await db.execute(
        select(Document).where(Document.uuid == uuid)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document_to_dict(document)


@router.get("/by-uuid/{uuid}/content")
async def get_document_content(uuid: UUID, db: AsyncSession = Depends(get_db)):
    """Serve the document file by UUID."""
    from fastapi.responses import Response
    
    result = await db.execute(
        select(Document).where(Document.uuid == uuid)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = get_file_path(document.filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found")
    
    # Read file content
    with open(file_path, "rb") as f:
        content = f.read()
    
    # Build headers with CORS
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Content-Disposition": f'inline; filename="{document.original_filename}"',
    }
    
    return Response(
        content=content,
        media_type=document.content_type,
        headers=headers,
    )


@router.get("/{document_id}")
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific document by ID."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document_to_dict(document)


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
        "uuid": str(document.uuid),
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
