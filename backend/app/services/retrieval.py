from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.embedding import generate_embedding


async def search_similar_chunks(
    query: str,
    db: AsyncSession,
    document_id: int | None = None,
    limit: int = 5
) -> list[dict]:
    """
    Find chunks most similar to the query using pgvector.
    Returns list of {id, content, page, document_id, filename, similarity}.
    """
    query_embedding = generate_embedding(query)
    
    # Convert embedding to pgvector format string
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    # pgvector cosine similarity search
    # Using string formatting for the vector since SQLAlchemy doesn't handle it well
    if document_id is not None:
        sql = text(f"""
            SELECT 
                c.id,
                c.content,
                c.page_number,
                c.document_id,
                d.original_filename,
                1 - (c.embedding <=> '{embedding_str}'::vector) as similarity
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'ready'
            AND c.document_id = :doc_id
            ORDER BY c.embedding <=> '{embedding_str}'::vector
            LIMIT :limit
        """)
        result = await db.execute(sql, {"doc_id": document_id, "limit": limit})
    else:
        sql = text(f"""
            SELECT 
                c.id,
                c.content,
                c.page_number,
                c.document_id,
                d.original_filename,
                1 - (c.embedding <=> '{embedding_str}'::vector) as similarity
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'ready'
            ORDER BY c.embedding <=> '{embedding_str}'::vector
            LIMIT :limit
        """)
        result = await db.execute(sql, {"limit": limit})
    
    return [
        {
            "id": row.id,
            "content": row.content,
            "page": row.page_number,
            "document_id": row.document_id,
            "filename": row.original_filename,
            "similarity": float(row.similarity) if row.similarity else 0.0
        }
        for row in result.fetchall()
    ]
