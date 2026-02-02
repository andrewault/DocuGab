from typing import AsyncGenerator
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.retrieval import search_similar_chunks

# Initialize LLM (lazy loading)
_llm = None


def get_llm() -> ChatOllama:
    """Get or create the LLM instance."""
    global _llm
    if _llm is None:
        _llm = ChatOllama(
            model=settings.llm_model,
            base_url=settings.ollama_base_url,
        )
    return _llm


SYSTEM_PROMPT = """You are a friendly and conversational assistant. Answer questions based ONLY on the provided context. 
If the answer is not in the context, say "I couldn't find that information in the documents."
Always cite your sources using [Source: filename] or [Source: filename, Page X] format. While you must still answer based ONLY on the provided 
context, you should engage the user warmly, use natural language, and be helpful.
"""


async def generate_response(
    query: str,
    db: AsyncSession,
    project_id: int | None = None,
    document_id: int | None = None,
) -> AsyncGenerator[str, None]:
    """
    Generate a streaming response with RAG context using Ollama.

    For multi-tenant security, pass project_id to scope retrieval to project documents.
    """

    # Retrieve relevant chunks (filtered by project_id for isolation)
    chunks = await search_similar_chunks(
        query, db, project_id=project_id, document_id=document_id, limit=5
    )

    if not chunks:
        yield "I don't have any documents to search. Please upload some documents first."
        return

    # Build context from retrieved chunks
    context_parts = []
    for c in chunks:
        source_ref = c['filename']
        if not c['filename'].strip().lower().endswith('.md'):
            source_ref += f", Page {c['page']}"
        context_parts.append(f"[{source_ref}]:\n{c['content']}")

    context = "\n\n---\n\n".join(context_parts)

    # Build messages
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}"),
    ]

    # Stream response from LLM
    llm = get_llm()
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield str(chunk.content)

    # Append sources with UUIDs for linking
    yield "\n\n**Sources:**\n"
    seen_docs = set()
    for c in chunks:
        doc_key = c["document_uuid"]
        if doc_key not in seen_docs:
            seen_docs.add(doc_key)
            filename_clean = c['filename'].strip().lower()
            print(f"DEBUG: Checking filename '{c['filename']}' (clean: '{filename_clean}') for .md extension")
            if filename_clean.endswith('.md'):
                yield f"- [{c['filename']}](/documents/{c['document_uuid']})\n"
            else:
                yield f"- [{c['filename']}](/documents/{c['document_uuid']}), Page {c['page']}\n"
