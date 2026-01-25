from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Document, Chunk
from app.services.storage import get_file_path
from app.services.extraction import extract_text
from app.services.chunking import chunk_text
from app.services.embedding import generate_embeddings


async def process_document(document_id: int, db: AsyncSession):
    """
    Full RAG pipeline: extract → chunk → embed → store.
    
    This processes a document and creates searchable vector embeddings.
    """
    # Get document
    document = await db.get(Document, document_id)
    if not document:
        raise ValueError(f"Document {document_id} not found")
    
    document.status = "processing"
    await db.commit()
    
    try:
        # Extract text from file
        file_path = get_file_path(document.filename)
        pages = extract_text(file_path)
        
        if not pages:
            raise ValueError("No text content extracted from document")
        
        # Chunk text with overlap
        chunks = chunk_text(pages)
        
        if not chunks:
            raise ValueError("No chunks created from document")
        
        # Generate embeddings (batch for efficiency)
        texts = [c["content"] for c in chunks]
        embeddings = await generate_embeddings(texts)
        
        # Store chunks with embeddings
        for chunk_data, embedding in zip(chunks, embeddings):
            chunk = Chunk(
                document_id=document.id,
                content=chunk_data["content"],
                page_number=chunk_data["page"],
                chunk_index=chunk_data["chunk_index"],
                embedding=embedding
            )
            db.add(chunk)
        
        document.status = "ready"
        await db.commit()
        
        return {
            "document_id": document.id,
            "chunks_created": len(chunks),
            "status": "ready"
        }
        
    except Exception as e:
        document.status = "error"
        document.error_message = str(e)
        await db.commit()
        raise
