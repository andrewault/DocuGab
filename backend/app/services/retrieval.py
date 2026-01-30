from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.embedding import generate_embedding


async def search_similar_chunks(
    query: str,
    db: AsyncSession,
    project_id: int | None = None,
    document_id: int | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    Find chunks most similar to the query using pgvector.

    IMPORTANT: For multi-tenant security, always pass project_id to scope results.

    Returns list of {id, content, page, document_id, document_uuid, filename, similarity}.
    """
    query_embedding = await generate_embedding(query)

    # Convert embedding to pgvector format string
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    # Build WHERE clause based on filters
    where_conditions = ["d.status = 'ready'"]
    params = {"limit": limit}

    if project_id is not None:
        where_conditions.append("d.project_id = :project_id")
        params["project_id"] = project_id

    if document_id is not None:
        where_conditions.append("c.document_id = :doc_id")
        params["doc_id"] = document_id

    where_clause = " AND ".join(where_conditions)

    # pgvector cosine similarity search
    sql = text(f"""
        SELECT 
            c.id,
            c.content,
            c.page_number,
            c.document_id,
            d.uuid as document_uuid,
            d.original_filename,
            1 - (c.embedding <=> '{embedding_str}'::vector) as similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE {where_clause}
        ORDER BY c.embedding <=> '{embedding_str}'::vector
        LIMIT :limit
    """)

    result = await db.execute(sql, params)

    return [
        {
            "id": row.id,
            "content": row.content,
            "page": row.page_number,
            "document_id": row.document_id,
            "document_uuid": str(row.document_uuid),
            "filename": row.original_filename,
            "similarity": float(row.similarity) if row.similarity else 0.0,
        }
        for row in result.fetchall()
    ]
