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


SYSTEM_PROMPT = """You are a helpful document assistant. Answer questions based ONLY on the provided context. 
If the answer is not in the context, say "I couldn't find that information in the documents."
Always cite your sources using [Source: filename, Page X] format."""


async def generate_response(
    query: str,
    db: AsyncSession,
    document_id: int | None = None
) -> AsyncGenerator[str, None]:
    """Generate a streaming response with RAG context using Ollama."""
    
    # Retrieve relevant chunks
    chunks = await search_similar_chunks(query, db, document_id, limit=5)
    
    if not chunks:
        yield "I don't have any documents to search. Please upload some documents first."
        return
    
    # Build context from retrieved chunks
    context = "\n\n---\n\n".join([
        f"[{c['filename']}, Page {c['page']}]:\n{c['content']}"
        for c in chunks
    ])
    
    # Build messages
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}")
    ]
    
    # Stream response from LLM
    llm = get_llm()
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield chunk.content
    
    # Append sources with UUIDs for linking
    yield "\n\n**Sources:**\n"
    seen_docs = set()
    for c in chunks:
        doc_key = c['document_uuid']
        if doc_key not in seen_docs:
            seen_docs.add(doc_key)
            yield f"- [{c['filename']}](/documents/{c['document_uuid']}), Page {c['page']}\n"

