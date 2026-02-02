from typing import AsyncGenerator
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.retrieval import search_similar_chunks
from app.models.media import ProjectMedia
from app.models.link import ProjectLink
import json
import re

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


SYSTEM_PROMPT = """You are a friendly and conversational assistant. 
Answer questions based ONLY on the provided context, with the following exception:
- You may respond naturally to greetings (e.g., "Hello", "Hi") and conversational openers (e.g., "How are you?") without needing context from the documents.

For all other queries:
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] or [Source: filename, Page X] format.

While strict about facts, you should engage the user warmly, use natural language, and be helpful.
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

    # Built-in Responses: Check for greetings to skip retrieval and sources
    builtin_keywords = {
        "hello",
        "hi",
        "hey",
        "greetings",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "how are you?",
        "how are you doing",
    }
    cleaned_query = query.strip().lower().rstrip("?!.,")

    if cleaned_query in builtin_keywords:
        # Direct chat without RAG (Built-in Response)
        messages = [
            SystemMessage(
                content="You are a friendly assistant. Respond naturally to the user's greeting."
            ),
            HumanMessage(content=query),
        ]
        llm = get_llm()
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield str(chunk.content)
        return

    # Retrieve relevant chunks (filtered by project_id for isolation)
    chunks = await search_similar_chunks(
        query, db, project_id=project_id, document_id=document_id, limit=5
    )

    if not chunks:
        yield "I don't have any documents to search. Please upload some documents first."
        return

    # Fetch Ancillary Resources if project_id is present
    media_items = []
    link_items = []
    if project_id:
        result_media = await db.execute(
            select(ProjectMedia).where(ProjectMedia.project_id == project_id)
        )
        media_items = result_media.scalars().all()

        result_links = await db.execute(
            select(ProjectLink).where(ProjectLink.project_id == project_id)
        )
        link_items = result_links.scalars().all()

    # Build context from retrieved chunks
    context_parts = []
    for c in chunks:
        source_ref = c["filename"]
        if not c["filename"].strip().lower().endswith(".md"):
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
    full_response_text = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            content = str(chunk.content)
            full_response_text += content
            yield content

    # Append sources with UUIDs for linking
    yield "\n\n**Sources:**\n"
    seen_docs = set()
    for c in chunks:
        doc_key = c["document_uuid"]
        if doc_key not in seen_docs:
            seen_docs.add(doc_key)
            filename_clean = c["filename"].strip().lower()
            if filename_clean.endswith(".md"):
                yield f"- [{c['filename']}](/documents/{c['document_uuid']})\n"
            else:
                yield f"- [{c['filename']}](/documents/{c['document_uuid']}), Page {c['page']}\n"

    # Ancillary Matching Logic
    found_media = []
    found_links = []

    # Simple word boundary matching
    # We combine the query and the response to find keywords?
    # The plan says "If the Chat response has a key word".
    text_to_scan = full_response_text.lower()

    for m in media_items:
        # Check if any keyword matches
        for kw in m.keywords:
            # Escape keyword for regex and look for word boundaries
            pattern = r"\b" + re.escape(kw.lower()) + r"\b"
            if re.search(pattern, text_to_scan):
                found_media.append(
                    {"type": m.type, "url": m.url, "description": m.description}
                )
                break  # Only add media item once even if multiple keywords match

    for link_item in link_items:
        for kw in link_item.keywords:
            pattern = r"\b" + re.escape(kw.lower()) + r"\b"
            if re.search(pattern, text_to_scan):
                found_links.append({"name": link_item.name, "url": link_item.url})
                break

    if found_media or found_links:
        ancillary_payload = {"media": found_media, "links": found_links}
        # Append as a special section that frontend can parse
        yield f"\n\n**Ancillary:**\n{json.dumps(ancillary_payload)}"
